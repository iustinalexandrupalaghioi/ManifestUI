export interface ActionError {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
  originalMessage?: string;
  title?: string;
  meta?: { type: string; [key: string]: unknown };
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

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

export class DescribedActionError extends Error {
  error: ActionError;
  constructor(error: ActionError) {
    super(error.message);
    this.name = "DescribedActionError";
    this.error = error;
  }
}

export interface BulkActionFailure {
  // Absent for a failed "add" — the record was never created.
  id?: string;
  message: string;
  originalMessage?: string;
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

// Wraps a single `ActionError` into the same `BulkActionResult` shape the per-id bulk actions produce, so every failure renders through one dialog.
export function toFailureResult(
  error: ActionError,
  ids: (string | number)[] = [],
): BulkActionResult {
  const shared = {
    message: error.message,
    originalMessage: error.originalMessage,
    meta: error.meta,
  };

  return {
    ok: false,
    succeededIds: [],
    failures:
      ids.length > 0
        ? ids.map((id) => ({ id: String(id), ...shared }))
        : [{ ...shared }],
    summary: error.title ?? error.message,
  };
}
