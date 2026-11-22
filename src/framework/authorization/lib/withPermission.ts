import "server-only";
import type { ActionResult } from "@/framework/lib/actionResult";
import { requirePermission } from "./requirePermission";
import { toActionResult } from "./toActionResult";

// Checks the permission, runs `fn` and returns its result or error as data
// (see toActionResult for why errors aren't thrown across the boundary).
export function withPermission<Args extends unknown[], R>(
  resourceId: string,
  action: string | string[],
  fn: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<ActionResult<R>> {
  const actionLabel = Array.isArray(action) ? action.join("|") : action;
  return (...args: Args) =>
    toActionResult(`${resourceId}:${actionLabel}`, async () => {
      await requirePermission(resourceId, action);
      return fn(...args);
    });
}
