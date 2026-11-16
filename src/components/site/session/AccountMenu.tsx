"use client";

import { Link } from "@/i18n/navigation";
import { UserMenu } from "../UserMenu";
import { useSiteSession } from "./SiteSession";

/** Desktop navbar slot: the account menu when signed in, otherwise "Log in". */
export function AccountMenu({ loginLabel, linkClassName }: { loginLabel: string; linkClassName: string }) {
  const session = useSiteSession();
  if (session)
    return <UserMenu displayName={session.displayName} avatarUrl={session.avatarUrl} canAccessCms={session.canAccessCms} />;
  return (
    <Link href="/auth/login" className={linkClassName}>
      {loginLabel}
    </Link>
  );
}
