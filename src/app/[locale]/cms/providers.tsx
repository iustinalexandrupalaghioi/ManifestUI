"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { getQueryClient } from "@/framework/lib/queryClient";
import { PERMISSIONS_QUERY_KEY } from "@/framework/authorization/cache/permissions";
import { CURRENT_USER_QUERY_KEY } from "@/framework/authorization/cache/currentUserId";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import "./registerResourceComponents";
import "@/lib/storage/registerDefaultStorageHandler";

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
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  useEffect(() => {
    queryClient.setQueryData(
      PERMISSIONS_QUERY_KEY,
      new Set(initialPermissions),
    );
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, userId);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ThemeProvider>
        {appNavBar}
        {/* Bounds page content to exactly the space left under the navbar.
         *  `nav` is sticky, which only holds within *its own parent's* box
         *  (this shell, h-screen). Without this wrapper, content taller
         *  than that remaining space bled past the shell uncontained — and
         *  once scrolled into that bled-over area, you'd scrolled past
         *  nav's containing block, so it stopped sticking.
         *  overflow-y-auto (not overflow-hidden) matters here: several
         *  descendants — anything that used to rely on the *document*
         *  scrolling, since nothing between them and <body> had its own
         *  overflow set — now find *this* div as their nearest scrolling
         *  ancestor instead. If it were overflow-hidden, it'd be a dead
         *  end: not user-scrollable, so their sticky positioning would
         *  never have anything to react to. Making it a real (if rarely
         *  needed) scroll container keeps their stickiness working. */}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
