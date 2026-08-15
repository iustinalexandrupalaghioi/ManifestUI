import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navbar } from "@/components/site/Navbar";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { getMyCanAccessCms } from "@/framework/authorization/actions/getMyPermissions";
import { fetchUserProfile } from "@/app/[locale]/(site)/data/currentUserProfile";
import "./globals.css";

export const metadata: Metadata = {
  title: "ManifestUI",
  description: "Full-stack app built with ManifestUI",
};

export default async function SiteLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [userId, canAccessCms] = await Promise.all([
    getCurrentUserId(),
    getMyCanAccessCms(),
  ]);
  const profile = userId ? await fetchUserProfile(userId) : null;
  const displayName = profile?.full_name || profile?.email || "Account";

  return (
    <ThemeProvider>
      <Navbar
        isAuthenticated={!!userId}
        displayName={displayName}
        canAccessCms={canAccessCms}
      />
      {children}
    </ThemeProvider>
  );
}
