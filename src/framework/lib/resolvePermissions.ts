import type { PermissionValue } from "@/framework/types/resource-components-types";

export function resolvePermission(value: PermissionValue | undefined): boolean {
  if (value === undefined) return true;
  return typeof value === "function" ? value() : value;
}
