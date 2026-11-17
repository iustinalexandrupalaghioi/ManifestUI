import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SiteHeaderSlot } from "@/components/site/SiteHeaderSlot";
import { SiteSessionProvider } from "@/components/site/internal/session/SiteSession";
import "./globals.css";

export const metadata: Metadata = {
  description: "Built with ManifestUI",
};

/**
 * The public site. Nothing here reads the request (cookies, the signed-in
 * user), so pages can be static and served from the cache until they're
 * saved in the CMS; the signed-in parts (account menu, "Edit this page") load
 * in the browser.
 */
export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ThemeProvider>
      <Toaster />
      <SiteSessionProvider>
        <SiteHeaderSlot />
        {children}
      </SiteSessionProvider>
    </ThemeProvider>
  );
}
