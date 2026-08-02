import "server-only";
import { db } from "@/db";
import { describeActionFailure } from "./describeActionFailure";
import { DescribedActionError, type ActionError } from "./actionResult";
import { ForbiddenError } from "@/framework/authorization/rbac";

type Tx = Parameters<typeof db.transaction>[0] extends (tx: infer T) => any
  ? T
  : never;

export interface PerIdFailure extends ActionError {
  id: string;
}

export interface PerIdResult {
  succeededIds: string[];
  failures: PerIdFailure[];
}

async function runTransaction<T>(
  fn: (tx: Tx) => Promise<T>,
  resourceId: string,
  id: string | number | undefined,
  verb: string,
): Promise<T> {
  try {
    return await db.transaction(fn);
  } catch (err) {
    // A permission guard thrown from inside `fn` (e.g. "can't strip your
    // own admin flag") is not a DB failure — let it reach withPermission
    // unchanged instead of getting rephrased as "Not able to update ...".
    if (err instanceof ForbiddenError) throw err;
    const described = await describeActionFailure(err, resourceId, id, verb);
    throw new DescribedActionError(described);
  }
}

async function runPerIdImpl<TId extends string | number>(
  ids: TId[],
  resourceId: string,
  fn: (tx: Tx, id: TId) => Promise<unknown>,
  verb: string,
): Promise<PerIdResult> {
  const succeededIds: string[] = [];
  const failures: PerIdFailure[] = [];

  for (const id of ids) {
    try {
      await db.transaction((tx) => fn(tx, id));
      succeededIds.push(String(id));
    } catch (err) {
      const described = await describeActionFailure(err, resourceId, id, verb);
      failures.push({ id: String(id), ...described });
    }
  }

  return { succeededIds, failures };
}

// Builds `[action, fn]` entries for defineResourceActions — resourceId
// (bound here, once per file) and the verb (implied by which of
// add/update/delete you call, matching the very key defineResourceActions
// stores the entry under) never need to be repeated at the call site.
export function createResourceActions(resourceId: string) {
  return {
    // `getId` is only useful when the id is knowable before insert (e.g. a
    // composite key built from the payload, as with user-roles) — omit it
    // and a DB-assigned id just won't be named in a failure message.
    add<TArgs extends unknown[], R>(
      fn: (tx: Tx, ...args: TArgs) => Promise<R>,
      getId?: (...args: TArgs) => string | number,
    ) {
      return [
        "add",
        (...args: TArgs) =>
          runTransaction(
            (tx) => fn(tx, ...args),
            resourceId,
            getId?.(...args),
            "add",
          ),
      ] as const;
    },

    update<TId extends string | number, TArgs extends unknown[], R>(
      fn: (tx: Tx, id: TId, ...args: TArgs) => Promise<R>,
    ) {
      return [
        "update",
        (id: TId, ...args: TArgs) =>
          runTransaction((tx) => fn(tx, id, ...args), resourceId, id, "update"),
      ] as const;
    },

    delete<TId extends string | number>(fn: (tx: Tx, id: TId) => Promise<unknown>) {
      return [
        "delete",
        (ids: TId[]) => runPerIdImpl(ids, resourceId, fn, "delete"),
      ] as const;
    },

    // Escape hatch for bulk actions whose permission/verb aren't the plain
    // "delete" (e.g. todos' "complete-with-note" → "complete"). `build`
    // receives the action's own extra args once (e.g. the note payload) and
    // returns the per-id transactional body — mirrors how the id-less parts
    // of `data` only need parsing once, not once per id.
    action<TId extends string | number, TArgs extends unknown[]>(
      permission: string,
      verb: string,
      build: (...args: TArgs) => (tx: Tx, id: TId) => Promise<unknown>,
    ) {
      return [
        permission,
        (ids: TId[], ...args: TArgs) =>
          runPerIdImpl(ids, resourceId, build(...args), verb),
      ] as const;
    },
  };
}
