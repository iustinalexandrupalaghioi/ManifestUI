"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyUserId } from "../actions/getMyPermissions";
import { CURRENT_USER_QUERY_KEY } from "../cache/currentUserId";

export function useCurrentUserId() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getMyUserId,
  });
}
