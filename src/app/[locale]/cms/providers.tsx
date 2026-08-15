"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { setStorageHandler } from "@/framework/components/files";
import { createSupabaseHandler } from "@/lib/storage/createSupabaseHandler";
import { getQueryClient } from "@/framework/lib/queryClient";
import { PERMISSIONS_QUERY_KEY } from "@/framework/authorization/cache/permissions";
import { CURRENT_USER_QUERY_KEY } from "@/framework/authorization/cache/currentUserId";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import "./registerResourceComponents";

setStorageHandler(
  createSupabaseHandler({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }),
);

export function Providers({
  children,
  appNavBar,
  initialPermissions,
  userId,
}: {
  children: ReactNode;
  appNavBar: ReactNode;
  initialPermissions: string[];
  userId: string | null;
}) {
  const queryClient = getQueryClient();

  useEffect(() => {
    // Seeded client-side only, never during render — writing to the query
    // cache is a side effect and belongs in an effect, not the render body.
    queryClient.setQueryData(
      PERMISSIONS_QUERY_KEY,
      new Set(initialPermissions),
    );
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ThemeProvider>
        {appNavBar}
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
