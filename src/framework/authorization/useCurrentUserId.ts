"use client";

import { useQuery } from "@tanstack/react-query";
import { getQueryClient } from "@/framework/lib/queryClient";
import { getMyUserId } from "./getMyPermissions";

export const CURRENT_USER_QUERY_KEY = ["auth", "userId"] as const;

export function useCurrentUserId() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getMyUserId,
  });
}

export function currentUserId(): string | null {
  return (
    getQueryClient().getQueryData<string | null>(CURRENT_USER_QUERY_KEY) ?? null
  );
}
