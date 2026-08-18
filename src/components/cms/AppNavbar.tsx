import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { LucideHome } from "lucide-react";
import { ThemeSwitcher } from "@/framework/components/partials/ThemeSwitcher";
import { LocaleSwitcher } from "@/framework/components/partials/LocaleSwitcher";
import { UserMenu } from "@/components/site/UserMenu";
import { Button } from "@/components/ui/button";

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

  return (
    <nav className="sticky top-0 z-50 mb-4 flex h-12 w-full items-center justify-between border-b bg-primary px-2 md:h-14">
      <div className="flex h-14 items-center gap-4">
        <Link href="/cms" className="flex items-center">
          <LucideHome className="text-primary-foreground" />
        </Link>

        <div id="toolbar-slot" className="h-full w-full bg-background" />
      </div>

      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <UserMenu
            displayName={displayName}
            avatarUrl={avatarUrl}
            canAccessCms={canAccessCms}
          />
        ) : (
          <>
            <LocaleSwitcher />
            <ThemeSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">{t("login")}</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
