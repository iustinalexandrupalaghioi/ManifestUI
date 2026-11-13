"use client";

import { getQueryClient } from "@/framework/lib/queryClient";

export const CURRENT_USER_QUERY_KEY = ["auth", "userId"] as const;

export function currentUserId(): string | null {
  return (
    getQueryClient().getQueryData<string | null>(CURRENT_USER_QUERY_KEY) ?? null
  );
}
