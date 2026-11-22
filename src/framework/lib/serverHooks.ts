import type { SQL, SQLWrapper } from "drizzle-orm";
import type { Tx } from "./transactionalAction";

type MaybePromise<T> = T | Promise<T>;
/** Extra column values to write with the record (derived values, timestamps…). */
type Extra = Record<string, unknown> | void;

/**
 * A resource's own server rules: logic a designer can't express (who may change what,
 * derived values). The generated api.ts calls them inside the save's transaction; a content
 * type's update goes through the publishing service, so `tx` is absent there. Throw to
 * refuse the change (a ForbiddenError reads as a permission error); return values to add to
 * what's written.
 */
export interface ResourceServerHooks<TFormValues, TId> {
  /**
   * Extra values each row is read with (list and detail), as SQL: a title taken from JSON, a name
   * from another table… Columns can show them (a row value column).
   */
  select?: Record<string, SQLWrapper>;
  /** Which rows the signed-in user may see at all (the list and a record); undefined: all. */
  scope?: () => MaybePromise<SQL | undefined>;
  beforeAdd?: (data: TFormValues, tx: Tx) => MaybePromise<Extra>;
  beforeUpdate?: (id: TId, data: TFormValues, tx?: Tx) => MaybePromise<Extra>;
  beforeDelete?: (id: TId, tx: Tx) => MaybePromise<void>;
}

/** Types a resource's hooks (config/hooks.ts). */
export function defineServerHooks<TFormValues, TId>(hooks: ResourceServerHooks<TFormValues, TId>): ResourceServerHooks<TFormValues, TId> {
  return hooks;
}
