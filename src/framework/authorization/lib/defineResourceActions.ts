import "server-only";
import type { ActionResult } from "@/framework/lib/actionResult";
import { withPermission } from "./withPermission";

// Wraps every function of a `config/api.ts` resource file in one call
// instead of one `withPermission(...)` per export. The point isn't
// ergonomics — it's that a resource's entire server-action surface has to
// be enumerated in a single object literal, so an export that bypasses it
// (a bare `export async function ...` sitting next to this call) stands out
// in review instead of blending in as "just another wrapped function you
// forgot to wrap":
//
//   export const { fetchUserList, updateUser, deleteUsers } =
//     defineResourceActions("users", {
//       fetchUserList: ["read", async (...) => { ... }],
//       updateUser: ["update", async (...) => { ... }],
//       deleteUsers: ["delete", async (...) => { ... }],
//     });
type WrappedAction<Fn extends (...args: never[]) => Promise<unknown>> = (
  ...args: Parameters<Fn>
) => Promise<ActionResult<Awaited<ReturnType<Fn>>>>;

export function defineResourceActions<
  Entries extends Record<
    string,
    readonly [
      action: string | string[],
      fn: (...args: never[]) => Promise<unknown>,
    ]
  >,
>(
  resourceId: string,
  actions: Entries,
): { [K in keyof Entries]: WrappedAction<Entries[K][1]> } {
  const wrapped = {} as { [K in keyof Entries]: WrappedAction<Entries[K][1]> };
  for (const key of Object.keys(actions) as (keyof Entries)[]) {
    const [action, fn] = actions[key];
    wrapped[key] = withPermission(resourceId, action, fn) as WrappedAction<
      Entries[typeof key][1]
    >;
  }
  return wrapped;
}
