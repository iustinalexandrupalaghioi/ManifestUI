"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeftIcon,
  LogOutIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  UserIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/framework/authentication/actions/logout";
import { getQueryClient } from "@/framework/lib/queryClient";
import { PERMISSIONS_QUERY_KEY } from "@/framework/authorization/cache/permissions";
import { CURRENT_USER_QUERY_KEY } from "@/framework/authorization/cache/currentUserId";
import { LocaleMenuSub } from "@/framework/components/partials/LocaleSwitcher";
import { ThemeMenuSub } from "@/framework/components/partials/ThemeSwitcher";

function initials(label: string): string {
  const parts = label.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

export function UserMenu({
  displayName,
  avatarUrl,
  canAccessCms,
}: {
  displayName: string;
  avatarUrl?: string | null;
  canAccessCms: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("Auth");
  const tSite = useTranslations("Site");
  const pathname = usePathname();
  const inCms = pathname.startsWith("/cms");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar>
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">
          {displayName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="text-muted-foreground" />
            {tSite("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SlidersHorizontalIcon className="text-muted-foreground" />
            {tSite("preferences")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <LocaleMenuSub label={tSite("language")} />
            <ThemeMenuSub label={tSite("theme")} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {inCms ? (
          <DropdownMenuItem asChild>
            <Link href="/">
              <ArrowLeftIcon className="text-muted-foreground" />
              {tSite("backToSite")}
            </Link>
          </DropdownMenuItem>
        ) : (
          canAccessCms && (
            <DropdownMenuItem asChild>
              <Link href="/cms">
                <ShieldIcon className="text-muted-foreground" />
                {tSite("adminPanel")}
              </Link>
            </DropdownMenuItem>
          )
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={() =>
            startTransition(async () => {
              await logout();
              getQueryClient().removeQueries({
                queryKey: PERMISSIONS_QUERY_KEY,
              });
              getQueryClient().removeQueries({
                queryKey: CURRENT_USER_QUERY_KEY,
              });
            })
          }
        >
          <LogOutIcon />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
