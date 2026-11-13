"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyPermissions } from "../actions/getMyPermissions";
import { PERMISSIONS_QUERY_KEY } from "../cache/permissions";

export function usePermissions() {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEY,
    queryFn: async () => new Set(await getMyPermissions()),
  });
}
