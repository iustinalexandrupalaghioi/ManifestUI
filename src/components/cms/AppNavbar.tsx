import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { HomeIcon } from "lucide-react";
import { ThemeSwitcher } from "@/framework/components/partials/ThemeSwitcher";
import { LocaleSwitcher } from "@/framework/components/partials/LocaleSwitcher";
import { UserMenu } from "@/components/site/UserMenu";
import { Button } from "@/components/ui/button";
import { BASE_ROUTE, NAVBAR_TONE } from "./constants";
import { CmsNavBreadcrumb, CmsNavMenu } from "./CmsNav";

/**
 * The CMS navbar: where you are (menu, home, breadcrumb) and who you are
 * (language, theme, account). A page's actions live in its own toolbar.
 */
export async function AppNavBar({
  isAuthenticated,
  displayName,
  avatarUrl,
  canAccessCms,
}: {
  isAuthenticated: boolean;
  displayName: string;
  avatarUrl?: string | null;
  canAccessCms: boolean;
}) {
  const t = await getTranslations("Auth");
  const tSite = await getTranslations("Site");
  const tMenu = await getTranslations("Menu");

  return (
    <nav
      data-tone={NAVBAR_TONE}
      className="cms-navbar sticky top-0 z-50 flex h-[52px] w-full shrink-0 items-center gap-2 border-b bg-sidebar px-2 text-sidebar-foreground sm:h-12 sm:px-3">
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        <CmsNavMenu />
        {/* Home on every screen size: on phones too, next to the menu (the title truncates). */}
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={BASE_ROUTE} aria-label={tMenu("home")} title={tMenu("home")}>
            <HomeIcon />
          </Link>
        </Button>
        <span aria-hidden className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" />
        <CmsNavBreadcrumb />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Signed in, language and theme are in the account menu; on phones also in the ☰ menu. */}
        {isAuthenticated ? (
          <UserMenu
            displayName={displayName}
            avatarUrl={avatarUrl}
            canAccessCms={canAccessCms}
          />
        ) : (
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <LocaleSwitcher label={tSite("language")} />
              <ThemeSwitcher label={tSite("theme")} />
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">{t("login")}</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
