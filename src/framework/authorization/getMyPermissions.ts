"use server";

import { getCurrentUserId, getUserPermissions } from "./rbac";

export async function getMyPermissions(): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  return getUserPermissions(userId);
}

export async function getMyUserId(): Promise<string | null> {
  return getCurrentUserId();
}
