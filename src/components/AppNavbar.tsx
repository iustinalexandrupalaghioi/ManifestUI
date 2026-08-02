import Link from "next/link";

import { LucideHome } from "lucide-react";
import { ThemeSwitcher } from "@/framework/components/partials/ThemeSwitcher";
import { LogoutButton } from "@/framework/authentication/LogoutButton";
import { Button } from "@/framework/components/ui/button";

export function AppNavBar({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <nav className="sticky top-0 z-50 mb-4 flex h-12 w-full items-center justify-between border-b bg-primary px-2 md:h-14">
      <div className="flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center">
          <LucideHome className="text-primary-foreground" />
        </Link>

        <div id="toolbar-slot" className="h-full w-full bg-background" />
      </div>

      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        {isAuthenticated ? (
          <LogoutButton />
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Login</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
