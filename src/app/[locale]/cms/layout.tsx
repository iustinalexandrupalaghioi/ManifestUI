import type { Metadata } from "next";
import {
  getMyPermissions,
  getMyCanAccessCms,
} from "@/framework/authorization/actions/getMyPermissions";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { fetchUserProfile } from "@/app/[locale]/(site)/data/currentUserProfile";
import { resolveAvatarUrl } from "@/framework/authentication/lib/resolveAvatarUrl";
import { AppNavBar } from "@/components/cms/AppNavbar";
import { Providers } from "./providers";
import { checkLocale, localeParams, RootDocument, rootMetadata } from "../_root/RootDocument";
import "./globals.css";

export const generateStaticParams = localeParams;

export const metadata: Metadata = {
  ...rootMetadata,
  title: "ManifestUI Admin",
  description: "Full-stack admin panel",
};

export default async function CmsLayout({
  children,
  params,
}: LayoutProps<"/[locale]/cms">) {
  const locale = checkLocale((await params).locale);

  const [initialPermissions, userId, canAccessCms] = await Promise.all([
    getMyPermissions(),
    getCurrentUserId(),
    getMyCanAccessCms(),
  ]);
  const profile = userId ? await fetchUserProfile(userId) : null;
  const displayName = profile?.full_name || profile?.email || "Account";
  const avatarUrl =
    profile && userId ? resolveAvatarUrl({ ...profile, id: userId }) : null;

  return (
    <RootDocument locale={locale}>
    <div className="flex h-screen w-full flex-col">
      <Providers
        initialPermissions={initialPermissions}
        userId={userId}
        appNavBar={
          <AppNavBar
            isAuthenticated={!!userId}
            displayName={displayName}
            avatarUrl={avatarUrl}
            canAccessCms={canAccessCms}
          />
        }
      >
        {children}
      </Providers>
    </div>
    </RootDocument>
  );
}
