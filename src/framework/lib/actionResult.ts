export interface ActionError {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
  originalMessage?: string;
  meta?: { type: string; [key: string]: unknown };
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

// Thrown client-side by `unwrapAction` so a failed `ActionResult` can flow
// back through react-query's normal rejection channel (mutationFn/queryFn),
// without ever having crossed the Server Action boundary as a thrown error
// itself — that boundary is what strips error detail in production. The
// `error` here already went through `mapCaughtError`/`mapPgError` on the
// server, so it's a complete, safe-to-render `AppError`, not a raw error.
export class ActionResultError extends Error {
  error: ActionError;
  constructor(error: ActionError) {
    super(error.message);
    this.name = "ActionResultError";
    this.error = error;
  }
}

export function unwrapAction<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new ActionResultError(result.error);
  return result.data;
}

// Thrown server-side by `withTransaction` (see transactionalAction.ts) once
// a failure has already been described via `describeActionFailure` — lets
// `withAdminAction` (framework/authorization/lib/withAdminAction.ts) forward
// that friendly ActionError as-is instead of re-mapping it through the
// generic `mapCaughtError` catalog.
export class DescribedActionError extends Error {
  error: ActionError;
  constructor(error: ActionError) {
    super(error.message);
    this.name = "DescribedActionError";
    this.error = error;
  }
}

export interface BulkActionFailure {
  id: string;
  message: string;
  meta?: ActionError["meta"];
}

export interface BulkActionResult {
  ok: boolean;
  succeededIds: string[];
  failures: BulkActionFailure[];
  summary: string;
}

export class BulkActionError extends Error {
  result: BulkActionResult;
  constructor(result: BulkActionResult) {
    super(result.summary);
    this.name = "BulkActionError";
    this.result = result;
  }
}

// Builds the summary/ok fields for a per-id result (see runPerId /
// runWithProgress) — the one place bulk-result wording is computed, shared
// by every bulk action (delete, complete, ...). Callers supply already
// locale-resolved wording so the summary isn't hardcoded to English.
export function toBulkActionResult(
  total: number,
  result: { succeededIds: string[]; failures: BulkActionFailure[] },
  format: {
    success: (count: number) => string;
    partial: (succeeded: number, total: number) => string;
    failure: (count: number) => string;
  },
): BulkActionResult {
  const { succeededIds, failures } = result;
  const summary =
    failures.length === 0
      ? format.success(total)
      : succeededIds.length === 0
        ? format.failure(failures.length)
        : format.partial(succeededIds.length, total);

  return { ok: failures.length === 0, succeededIds, failures, summary };
}
