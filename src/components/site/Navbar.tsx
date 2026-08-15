import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ThemeSwitcher } from "@/framework/components/partials/ThemeSwitcher";
import { LocaleSwitcher } from "@/framework/components/partials/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";

export async function Navbar({
  isAuthenticated,
  displayName,
  canAccessCms,
}: {
  isAuthenticated: boolean;
  displayName: string;
  canAccessCms: boolean;
}) {
  const t = await getTranslations("Auth");

  return (
    <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-heading text-lg font-semibold">
          ManifestUI
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeSwitcher />
        {isAuthenticated ? (
          <UserMenu displayName={displayName} canAccessCms={canAccessCms} />
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/login">{t("login")}</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
