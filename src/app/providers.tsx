"use client";

import { AppNavBar } from "@/components/AppNavbar";
import { Toaster } from "@/framework/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import {
  createSupabaseHandler,
  setStorageHandler,
} from "@/framework/components/files";
import { queryClient } from "@/framework/lib/queryClient";
import { PERMISSIONS_QUERY_KEY } from "@/framework/authorization/usePermissions";
import { CURRENT_USER_QUERY_KEY } from "@/framework/authorization/useCurrentUserId";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import "./register-resources";
import "@/framework/components/dialog/fkReferencesErrorExtra";

setStorageHandler(
  createSupabaseHandler({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }),
);

export function Providers({
  children,
  initialPermissions,
  isAuthenticated,
  userId,
}: {
  children: ReactNode;
  initialPermissions: string[];
  isAuthenticated: boolean;
  userId: string | null;
}) {
  useEffect(() => {
    // Seeded client-side only, never during render — queryClient is a
    // process-wide singleton shared across concurrent server requests, so
    // writing to it during SSR could leak one user's permissions into
    // another request rendered on the same server worker.
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
        <AppNavBar isAuthenticated={isAuthenticated} />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
