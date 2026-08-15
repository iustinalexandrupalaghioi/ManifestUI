"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogOutIcon, ShieldIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/framework/authentication/actions/logout";
import { getQueryClient } from "@/framework/lib/queryClient";
import { PERMISSIONS_QUERY_KEY } from "@/framework/authorization/cache/permissions";
import { CURRENT_USER_QUERY_KEY } from "@/framework/authorization/cache/currentUserId";

function initials(label: string): string {
  const parts = label.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

export function UserMenu({
  displayName,
  canAccessCms,
}: {
  displayName: string;
  canAccessCms: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("Auth");
  const tSite = useTranslations("Site");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar>
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">
          {displayName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canAccessCms && (
          <DropdownMenuItem asChild>
            <Link target="_blank" href="/cms">
              <ShieldIcon className="text-muted-foreground" />
              {tSite("adminPanel")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={() =>
            startTransition(async () => {
              await logout();
              getQueryClient().removeQueries({ queryKey: PERMISSIONS_QUERY_KEY });
              getQueryClient().removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
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
