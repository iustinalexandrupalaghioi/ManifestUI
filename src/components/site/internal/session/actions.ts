"use server";

import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { hasAnyGroup, hasServerPermission } from "@/framework/authorization/lib/permissions";
import { resolveAvatarUrl } from "@/framework/authentication/lib/resolveAvatarUrl";
import { fetchUserProfile } from "@/app/[locale]/(site)/data/currentUserProfile";

export interface SiteSession {
  displayName: string;
  avatarUrl: string | null;
  canAccessCms: boolean;
  /** "Edit this page" / "Edit this lesson". */
  canEdit: { page: boolean; lesson: boolean };
}

/**
 * The signed-in visitor's navbar and editing details, or null for visitors.
 * Public pages are static and the same for everyone, so they ask for this
 * from the browser after loading (see SiteSessionProvider).
 */
export async function getSiteSession(): Promise<SiteSession | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const [profile, canAccessCms, canEditPages, canEditLessons] = await Promise.all([
    fetchUserProfile(userId),
    hasAnyGroup(userId),
    hasServerPermission(userId, "site-pages:update"),
    hasServerPermission(userId, "learn-lessons:update"),
  ]);
  return {
    displayName: profile?.full_name || profile?.email || "Account",
    avatarUrl: profile ? resolveAvatarUrl({ ...profile, id: userId }) : null,
    canAccessCms,
    canEdit: { page: canEditPages, lesson: canEditLessons },
  };
}
