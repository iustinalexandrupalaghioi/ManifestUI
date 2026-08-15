import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getMyPermissions } from "@/framework/authorization/actions/getMyPermissions";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { AppNavBar } from "@/components/cms/AppNavbar";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ManifestUI Admin",
  description: "Full-stack admin panel",
};

export default async function CmsLayout({
  children,
  params,
}: LayoutProps<"/[locale]/cms">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [initialPermissions, userId] = await Promise.all([
    getMyPermissions(),
    getCurrentUserId(),
  ]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <Providers
        initialPermissions={initialPermissions}
        userId={userId}
        appNavBar={<AppNavBar isAuthenticated={!!userId} />}
      >
        {children}
      </Providers>
    </div>
  );
}
