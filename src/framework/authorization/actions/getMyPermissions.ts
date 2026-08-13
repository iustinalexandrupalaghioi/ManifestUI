"use server";

import { getCurrentUserId } from "../lib/getCurrentUserId";
import { getUserPermissions } from "../lib/permissions";

export async function getMyPermissions(): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  return getUserPermissions(userId);
}

export async function getMyUserId(): Promise<string | null> {
  return getCurrentUserId();
}
