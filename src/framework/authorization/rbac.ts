import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { role_resource_permissions, roles, user_roles, users } from "@/db/schema";
import { getSupabase } from "@/lib/supabase/getSupabase";
import { mapCaughtError } from "@/framework/lib/mapPgError";
import { DescribedActionError, type ActionResult } from "@/framework/lib/actionResult";
import { ALL_PERMISSIONS } from "./constants";

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Global escape hatch — set ENABLE_RBAC=false to grant every permission to
// every signed-in user, bypassing roles/permissions entirely.
function isRbacEnabled(): boolean {
  return process.env.ENABLE_RBAC !== "false";
}

export async function isAdministrator(userId: string): Promise<boolean> {
  const rows = await db
    .select({ administrator: users.administrator })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0]?.administrator ?? false;
}

type PermissionRow = {
  resource_id: string;
  can_read: boolean | null;
  can_add: boolean | null;
  can_update: boolean | null;
  can_delete: boolean | null;
  allowed: boolean | null;
};

// `resource_id` is a code-level id (see src/app/grantablePermissions.ts),
// not a DB foreign key — it's either a resourceDescriptors id ("todos"),
// expanded via the CRUD flags into "todos:read"/"todos:add"/etc., or an
// already-full grantableActions permission string ("todos:complete-with-note",
// distinguished by containing ":"), gated by the single `allowed` flag.
function expandPermissionRows(rows: PermissionRow[]): string[] {
  return rows.flatMap((row) =>
    row.resource_id.includes(":")
      ? row.allowed
        ? [row.resource_id]
        : []
      : (
          [
            row.can_read && `${row.resource_id}:read`,
            row.can_add && `${row.resource_id}:add`,
            row.can_update && `${row.resource_id}:update`,
            row.can_delete && `${row.resource_id}:delete`,
          ] as const
        ).filter((v): v is string => !!v),
  );
}

// Raw permission grants for a fixed set of roles, independent of which user
// (if any) actually holds them — used both by `getUserPermissions` (the
// caller's own roles) and by `assertHasAllPermissions` (a role about to be
// granted to someone, or a permission about to be added to a role), so a
// grant can be checked against what its *source* actually holds.
export async function getPermissionsForRoleIds(
  roleIds: number[],
): Promise<string[]> {
  if (roleIds.length === 0) return [];

  const rows = await db
    .select({
      resource_id: role_resource_permissions.resource_id,
      can_read: role_resource_permissions.can_read,
      can_add: role_resource_permissions.can_add,
      can_update: role_resource_permissions.can_update,
      can_delete: role_resource_permissions.can_delete,
      allowed: role_resource_permissions.allowed,
    })
    .from(role_resource_permissions)
    .where(inArray(role_resource_permissions.role_id, roleIds));

  return expandPermissionRows(rows);
}

// Administrators skip role/permission checks entirely — they get every
// permission, including ones with no row in `role_resource_permissions` yet
// (e.g. a resource nobody has granted access to), not just what's assigned
// via roles.
export async function getUserPermissions(userId: string): Promise<string[]> {
  if (!isRbacEnabled() || (await isAdministrator(userId))) {
    return [ALL_PERMISSIONS];
  }

  const roleRows = await db
    .select({ roleId: user_roles.role_id })
    .from(user_roles)
    .where(eq(user_roles.user_id, userId));

  return getPermissionsForRoleIds(roleRows.map((row) => row.roleId));
}

// Confused-deputy guard for permission-granting endpoints (assigning a role
// to a user, adding/editing a role's resource permissions): a caller may
// only hand out permissions they themselves hold. Without this, a role
// scoped to "can manage user-role assignments" or "can manage role
// permissions" would be root-equivalent, since it could otherwise assign
// any role — including a more privileged one — to any user, or edit any
// role's grants (including its own) without limit.
export async function assertHasAllPermissions(
  userId: string,
  permissions: string[],
  context: string,
): Promise<void> {
  if (permissions.length === 0) return;

  const callerPermissions = new Set(await getUserPermissions(userId));
  if (callerPermissions.has(ALL_PERMISSIONS)) return;

  const missing = permissions.filter((p) => !callerPermissions.has(p));
  if (missing.length > 0) {
    throw new ForbiddenError(`${context} (would grant: ${missing.join(", ")})`);
  }
}

// Given a `role_resource_permissions` row's flags (as about to be
// inserted/updated), reconstructs the permission string(s) it would grant —
// so a write to that table can be checked against `assertHasAllPermissions`
// the same way a role assignment is. No DB lookup needed: `resourceId` is
// already the code-level id being granted against (see
// src/app/grantablePermissions.ts), not a row to resolve.
export function permissionStringsForResourceGrant(
  resourceId: string,
  flags: {
    can_read?: boolean | null;
    can_add?: boolean | null;
    can_update?: boolean | null;
    can_delete?: boolean | null;
    allowed?: boolean | null;
  },
): string[] {
  return expandPermissionRows([
    {
      resource_id: resourceId,
      can_read: flags.can_read ?? false,
      can_add: flags.can_add ?? false,
      can_update: flags.can_update ?? false,
      can_delete: flags.can_delete ?? false,
      allowed: flags.allowed ?? false,
    },
  ]);
}

export async function hasServerPermission(
  userId: string | null,
  permission: string,
): Promise<boolean> {
  if (!userId) return false;
  const perms = await getUserPermissions(userId);
  return perms.includes(ALL_PERMISSIONS) || perms.includes(permission);
}

export async function hasRole(
  userId: string,
  roleName: string,
): Promise<boolean> {
  if (!isRbacEnabled() || (await isAdministrator(userId))) return true;

  const rows = await db
    .select({ id: roles.id })
    .from(user_roles)
    .innerJoin(roles, eq(roles.id, user_roles.role_id))
    .where(and(eq(user_roles.user_id, userId), eq(roles.name, roleName)))
    .limit(1);

  return rows.length > 0;
}

export class ForbiddenError extends Error {
  constructor(permission: string) {
    super(`Forbidden: missing permission "${permission}"`);
    this.name = "ForbiddenError";
  }
}

export async function requirePermission(
  resourceId: string,
  action: string,
): Promise<string> {
  const permission = `${resourceId}:${action}`;
  const userId = await getCurrentUserId();
  if (!userId) throw new ForbiddenError(permission);

  const allowed = await hasServerPermission(userId, permission);
  if (!allowed) throw new ForbiddenError(permission);

  return userId;
}

// Server Actions that throw have their error message stripped in
// production — Next.js only forwards a `digest` across that boundary, so
// any thrown error (a permission check, a unique-constraint violation, a
// not-found) reaches the client as an opaque "something went wrong"
// message with no way to recover it. `withPermission` catches everything
// here and returns it as normal data instead, per Next's own guidance for
// expected errors (see node_modules/next/dist/docs/.../error-handling.md,
// "avoid throwing... model expected errors as return values").
export function withPermission<Args extends unknown[], R>(
  resourceId: string,
  action: string,
  fn: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<ActionResult<R>> {
  return async (...args: Args) => {
    try {
      await requirePermission(resourceId, action);
      const data = await fn(...args);
      return { ok: true, data };
    } catch (err) {
      // The original error (with full stack/cause) still goes to the
      // server log here — only the sanitized AppError below reaches the
      // client.
      console.error(`[${resourceId}:${action}]`, err);

      if (err instanceof ForbiddenError) {
        return {
          ok: false,
          error: {
            message: "You don't have permission to perform this action.",
            originalMessage: err.message,
            meta: { type: "forbidden" },
          },
        };
      }

      if (err instanceof DescribedActionError) {
        return { ok: false, error: err.error };
      }

      if (err instanceof ZodError) {
        return {
          ok: false,
          error: {
            message: "Invalid input.",
            meta: {
              type: "validation",
              issues: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
        };
      }

      return { ok: false, error: mapCaughtError(err) };
    }
  };
}

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
    readonly [action: string, fn: (...args: never[]) => Promise<unknown>]
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
