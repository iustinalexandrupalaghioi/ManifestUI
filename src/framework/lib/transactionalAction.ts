import "server-only";
import { getDbClient, type DbClient } from "./dbClient";
import { describeActionFailure } from "./describeActionFailure";
import { DescribedActionError, type ActionError } from "./actionResult";
import { ForbiddenError } from "@/framework/authorization/lib/ForbiddenError";
import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";

type Tx = Parameters<DbClient["transaction"]>[0] extends (tx: infer T) => any
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
  registry: ResourceDescriptor[],
  resourceId: string,
  id: string | number | undefined,
  verb: string,
): Promise<T> {
  try {
    return await getDbClient().transaction(fn);
  } catch (err) {
    // A permission guard thrown from inside `fn` (e.g. "can't strip your
    // own admin flag") is not a DB failure — let it reach withAdminAction
    // unchanged instead of getting rephrased as "Not able to update ...".
    if (err instanceof ForbiddenError) throw err;
    const described = await describeActionFailure(registry, err, resourceId, id, verb);
    throw new DescribedActionError(described);
  }
}

async function runPerIdImpl<TId extends string | number>(
  ids: TId[],
  registry: ResourceDescriptor[],
  resourceId: string,
  fn: (tx: Tx, id: TId) => Promise<unknown>,
  verb: string,
): Promise<PerIdResult> {
  const succeededIds: string[] = [];
  const failures: PerIdFailure[] = [];

  for (const id of ids) {
    try {
      await getDbClient().transaction((tx) => fn(tx, id));
      succeededIds.push(String(id));
    } catch (err) {
      const described = await describeActionFailure(registry, err, resourceId, id, verb);
      failures.push({ id: String(id), ...described });
    }
  }

  return { succeededIds, failures };
}

// Builds `[verb, fn]` entries for defineResourceActions (rbac.ts) —
// resourceId (bound here, once per file) and the verb (implied by which of
// add/update/delete you call) never need to be repeated at the call site.
// Each entry slots directly into defineResourceActions' object literal,
// which wraps it with withPermission(resourceId, verb, fn) — this layer
// only handles the DB transaction + failure description, not permissions.
export function createResourceActions(
  resourceId: string,
  registry: ResourceDescriptor[],
) {
  return {
    // `getId` is only useful when the id is knowable before insert (e.g. a
    // composite key built from the payload, as with user-groups) — omit it
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
            registry,
            resourceId,
            getId?.(...args),
            "add",
          ),
      ] as const;
    },

    // `alsoAllow` widens who can call this beyond "update" — e.g. a file
    // path patch that's really just finishing an "add" the caller already
    // had rights to. Only use it when `fn` is scoped narrowly enough that
    // granting it under another verb can't be used to edit fields that
    // verb shouldn't reach.
    update<TId extends string | number, TArgs extends unknown[], R>(
      fn: (tx: Tx, id: TId, ...args: TArgs) => Promise<R>,
      options?: { alsoAllow?: string[] },
    ) {
      return [
        options?.alsoAllow ? ["update", ...options.alsoAllow] : "update",
        (id: TId, ...args: TArgs) =>
          runTransaction(
            (tx) => fn(tx, id, ...args),
            registry,
            resourceId,
            id,
            "update",
          ),
      ] as const;
    },

    delete<TId extends string | number>(fn: (tx: Tx, id: TId) => Promise<unknown>) {
      return [
        "delete",
        (ids: TId[]) => runPerIdImpl(ids, registry, resourceId, fn, "delete"),
      ] as const;
    },

    // Escape hatch for bulk actions whose verb isn't the plain "delete"
    // (e.g. todos' completeTodos → "complete"). `build` receives the
    // action's own extra args once (e.g. the note payload) and returns the
    // per-id transactional body — mirrors how the id-less parts of `data`
    // only need parsing once, not once per id.
    action<TId extends string | number, TArgs extends unknown[]>(
      verb: string,
      build: (...args: TArgs) => (tx: Tx, id: TId) => Promise<unknown>,
    ) {
      return [
        verb,
        (ids: TId[], ...args: TArgs) =>
          runPerIdImpl(ids, registry, resourceId, build(...args), verb),
      ] as const;
    },
  };
}
