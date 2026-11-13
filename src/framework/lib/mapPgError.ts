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

function getErrorsTranslator(locale: string) {
  const messages =
    ERRORS_MESSAGES[locale] ?? ERRORS_MESSAGES[routing.defaultLocale];
  return createTranslator({
    locale,
    messages: { Errors: messages },
    namespace: "Errors",
  });
}

type ErrorsTranslator = ReturnType<typeof getErrorsTranslator>;

const PG_ERROR_MESSAGES: Record<
  string,
  (err: PgError, t: ErrorsTranslator) => string
> = {
  "23503": (err, t) => {
    // Delete blocked — record is still referenced. No registry access here
    // to resolve the table to a friendly resource name (see
    // describeActionFailure.ts for the friendly version of this case) — stay
    // generic rather than leak a raw DB table name.
    if (/still referenced from table "(.+)"/.test(err.details ?? "")) {
      return t("fkStillReferenced");
    }

    // Insert/update blocked — foreign key value doesn't exist. Same
    // no-registry constraint — name the offending value, not the table.
    const missingMatch = err.details?.match(
      /Key \(.+\)=\((.+)\) is not present in table/,
    );
    if (missingMatch) {
      return t("fkMissingReference", { value: missingMatch[1] });
    }

    return t("fkViolation");
  },
  "23505": (err, t) => {
    const match = err.details?.match(/Key \((.+)\)=\((.+)\) already exists/);
    if (match)
      return t("uniqueViolationWithValue", {
        column: match[1],
        value: match[2],
      });
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

export function extractPgError(err: unknown): PgError {
  const top = err as PgError & { cause?: unknown };
  const cause = top?.cause;
  const pg = (cause && typeof cause === "object" ? cause : top) as PgError;

  return {
    message: pg?.message ?? top?.message ?? "An unexpected error occurred.",
    code: pg?.code,
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
