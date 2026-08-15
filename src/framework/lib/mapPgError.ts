import { createTranslator } from "next-intl";
import type { AppError } from "@/framework/types/global/AppError";
import { routing } from "@/i18n/routing";
import enErrors from "../../../messages/en/framework/Errors.json";
import roErrors from "../../../messages/ro/framework/Errors.json";

interface PgError {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
  table_name?: string;
  constraint_name?: string;
}

const ERRORS_MESSAGES: Record<string, Record<string, string>> = {
  en: enErrors,
  ro: roErrors,
};

// Plain function (not a hook) so it's callable both from component render
// (with `useLocale()`'s result) and from server-only, non-component call
// sites (with `getLocale()`'s result) — see resolveLabel.ts for the same
// pattern, and the comment there for why.
function getErrorsTranslator(locale: string) {
  const messages = ERRORS_MESSAGES[locale] ?? ERRORS_MESSAGES[routing.defaultLocale];
  return createTranslator({ locale, messages: { Errors: messages }, namespace: "Errors" });
}

type ErrorsTranslator = ReturnType<typeof getErrorsTranslator>;

const PG_ERROR_MESSAGES: Record<string, (err: PgError, t: ErrorsTranslator) => string> = {
  "23503": (err, t) => {
    // Delete blocked — record is still referenced
    const refMatch = err.details?.match(/still referenced from table "(.+)"/);
    if (refMatch) {
      return t("fkStillReferenced", { table: refMatch[1] });
    }

    // Insert/update blocked — foreign key value doesn't exist
    const missingMatch = err.details?.match(/is not present in table "(.+)"/);
    if (missingMatch) {
      return t("fkMissingReference", { table: missingMatch[1] });
    }

    return t("fkViolation");
  },
  "23505": (err, t) => {
    const match = err.details?.match(/Key \((.+)\)=\((.+)\) already exists/);
    if (match) return t("uniqueViolationWithValue", { column: match[1], value: match[2] });
    return t("uniqueViolation");
  },
  "23502": (err, t) => {
    const match = err.message.match(/column "(.+)"/);
    return match
      ? t("requiredFieldNamed", { column: match[1] })
      : t("requiredField");
  },
  "23514": (err, t) => {
    const match = err.message.match(/violates check constraint "(.+)"/);
    const constraint = match?.[1];

    const CHECK_CONSTRAINT_KEYS: Record<string, string> = {
      course_session_available_spots_check: "checkConstraintSpotsAvailable",
    };

    if (constraint && CHECK_CONSTRAINT_KEYS[constraint]) {
      return t(CHECK_CONSTRAINT_KEYS[constraint]);
    }

    return t("checkConstraintGeneric");
  },
  "22007": (err, t) => {
    const match = err.message.match(
      /invalid input syntax for type (.+?): "(.*)"/,
    );

    if (match) {
      const [, type, value] = match;
      const typeLabelKey =
        {
          "timestamp with time zone": "typeDateTime",
          timestamptz: "typeDateTime",
          timestamp: "typeDateTime",
          date: "typeDate",
          time: "typeTime",
        }[type] ?? undefined;
      const typeLabel = typeLabelKey ? t(typeLabelKey) : type;

      return value === ""
        ? t("dateTimeEmpty", { typeLabel })
        : t("dateTimeInvalid", { value, typeLabel });
    }

    return t("dateTimeGeneric");
  },
  PGRST116: (_err, t) => t("recordNotFound"),
  PGRST204: (_err, t) => t("fieldNotInDatabase"),
};

// Drizzle (postgres.js) throws a `DrizzleQueryError` whose own `message` is
// just "Failed query: <sql>" — the actual Postgres error (with `code`,
// `detail`, `hint`) lives on `.cause`. Server actions catch the error at the
// `withAdminAction` boundary (see
// framework/authorization/lib/withAdminAction.ts) before it can cross back to
// the client, so this is the one place that needs to know about that
// wrapping; everywhere else just deals in the resulting `AppError`.
export function extractPgError(err: unknown): PgError {
  const top = err as PgError & { cause?: unknown };
  const cause = top?.cause;
  const pg = (
    cause && typeof cause === "object" ? cause : top
  ) as PgError;

  return {
    message: pg?.message ?? top?.message ?? "An unexpected error occurred.",
    code: pg?.code,
    // Drizzle/postgres.js errors expose `detail` (singular, matches the PG
    // wire protocol) instead of the PostgREST-style `details`.
    details: pg?.details ?? (pg as { detail?: string })?.detail,
    hint: pg?.hint,
    table_name: pg?.table_name,
    constraint_name: pg?.constraint_name,
  };
}

export function mapCaughtError(err: unknown, locale: string): AppError {
  return mapPgError(extractPgError(err), locale);
}

export function mapPgError(
  err: PgError & { meta?: AppError["meta"] },
  locale: string,
): AppError {
  const t = getErrorsTranslator(locale);
  const friendlyMessage = err.code
    ? PG_ERROR_MESSAGES[err.code]?.(err, t)
    : undefined;

  // `details`/`hint`/`originalMessage` can contain literal row values (e.g.
  // a 23505 unique-violation message includes the exact value that already
  // exists), which lets anyone with `add`/`update` permission on a table
  // probe for other rows' field values via constraint errors. Only forward
  // the raw Postgres detail outside production, where a developer debugging
  // the error needs it; production users get the friendly message only.
  const includeRawDetail = process.env.NODE_ENV !== "production";
  const message = friendlyMessage || err.message || t("unexpectedError");

  return {
    message,
    originalMessage: includeRawDetail ? err.message : message,
    code: err.code,
    details: includeRawDetail ? (err.details ?? undefined) : undefined,
    hint: includeRawDetail ? (err.hint ?? undefined) : undefined,
    meta: err.meta,
  };
}
