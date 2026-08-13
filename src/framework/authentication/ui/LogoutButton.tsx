"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { logout } from "../actions/logout";
import { getQueryClient } from "@/framework/lib/queryClient";
import { PERMISSIONS_QUERY_KEY } from "@/framework/authorization/cache/permissions";
import { CURRENT_USER_QUERY_KEY } from "@/framework/authorization/cache/currentUserId";

export function LogoutButton() {
  const t = useTranslations("Auth");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await logout();
          getQueryClient().removeQueries({ queryKey: PERMISSIONS_QUERY_KEY });
          getQueryClient().removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
        })
      }
    >
      <LogOutIcon className="text-destructive mr-1" /> {t("logout")}
    </Button>
  );
}
