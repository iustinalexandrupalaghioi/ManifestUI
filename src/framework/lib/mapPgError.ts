import type { AppError } from "@/framework/types/global/AppError";

interface PgError {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
  table_name?: string;
  constraint_name?: string;
}

const PG_ERROR_MESSAGES: Record<string, (err: PgError) => string> = {
  "23503": (err) => {
    // Delete blocked — record is still referenced
    const refMatch = err.details?.match(/still referenced from table "(.+)"/);
    if (refMatch) {
      return `This record cannot be deleted because it is still referenced by "${refMatch[1]}".`;
    }

    // Insert/update blocked — foreign key value doesn't exist
    const missingMatch = err.details?.match(/is not present in table "(.+)"/);
    if (missingMatch) {
      return `The referenced record does not exist in "${missingMatch[1]}".`;
    }

    return "A foreign key constraint was violated.";
  },
  "23505": (err) => {
    const match = err.details?.match(/Key \((.+)\)=\((.+)\) already exists/);
    if (match) return `A record with ${match[1]} "${match[2]}" already exists.`;
    return "A record with these values already exists.";
  },
  "23502": (err) => {
    const match = err.message.match(/column "(.+)"/);
    return match
      ? `"${match[1]}" is required and cannot be empty.`
      : "A required field is missing.";
  },
  "23514": (err) => {
    const match = err.message.match(/violates check constraint "(.+)"/);
    const constraint = match?.[1];

    const CHECK_CONSTRAINT_MESSAGES: Record<string, string> = {
      course_session_available_spots_check:
        "Available spots must be greater than 0.",
    };

    if (constraint && CHECK_CONSTRAINT_MESSAGES[constraint]) {
      return CHECK_CONSTRAINT_MESSAGES[constraint];
    }

    return "One or more values are invalid.";
  },
  "22007": (err) => {
    const match = err.message.match(
      /invalid input syntax for type (.+?): "(.*)"/,
    );

    if (match) {
      const [, type, value] = match;
      const typeLabel =
        {
          "timestamp with time zone": "date/time",
          timestamptz: "date/time",
          timestamp: "date/time",
          date: "date",
          time: "time",
        }[type] ?? type;

      return value === ""
        ? `A ${typeLabel} field was left empty when it should have been omitted or set to null.`
        : `"${value}" is not a valid ${typeLabel} value.`;
    }

    return "One or more date or time values are formatted incorrectly.";
  },
  PGRST116: () =>
    "The record could not be found or you do not have permission to access it.",
  PGRST204: () => "A field in this form doesn't exist in the database.",
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

export function mapCaughtError(err: unknown): AppError {
  return mapPgError(extractPgError(err));
}

export function mapPgError(
  err: PgError & { meta?: AppError["meta"] },
): AppError {
  const friendlyMessage = err.code
    ? PG_ERROR_MESSAGES[err.code]?.(err)
    : undefined;

  // `details`/`hint`/`originalMessage` can contain literal row values (e.g.
  // a 23505 unique-violation message includes the exact value that already
  // exists), which lets anyone with `add`/`update` permission on a table
  // probe for other rows' field values via constraint errors. Only forward
  // the raw Postgres detail outside production, where a developer debugging
  // the error needs it; production users get the friendly message only.
  const includeRawDetail = process.env.NODE_ENV !== "production";
  const message = friendlyMessage ?? err.message ?? "An unexpected error occurred.";

  return {
    message,
    originalMessage: includeRawDetail ? err.message : message,
    code: err.code,
    details: includeRawDetail ? (err.details ?? undefined) : undefined,
    hint: includeRawDetail ? (err.hint ?? undefined) : undefined,
    meta: err.meta,
  };
}
