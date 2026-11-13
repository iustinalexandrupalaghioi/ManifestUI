"use client";

import { getQueryClient } from "@/framework/lib/queryClient";
import { ALL_PERMISSIONS } from "../constants";

export const PERMISSIONS_QUERY_KEY = ["auth", "permissions"] as const;

// Plain, synchronous — safe to call from anywhere (including the
// PermissionValue closures defineResourceComponents builds at module-eval
// time). Fails closed: hidden, not shown, while unresolved.
export function hasPermission(name: string): boolean {
  const data = getQueryClient().getQueryData<Set<string>>(PERMISSIONS_QUERY_KEY);
  return data?.has(ALL_PERMISSIONS) || data?.has(name) || false;
}
