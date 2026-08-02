"use client";

import { useTransition } from "react";
import { Button } from "@/framework/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { logout } from "./actions/logout";
import { queryClient } from "@/framework/lib/queryClient";
import { PERMISSIONS_QUERY_KEY } from "@/framework/authorization/usePermissions";

export function LogoutButton() {
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
          queryClient.removeQueries({ queryKey: PERMISSIONS_QUERY_KEY });
        })
      }
    >
      <LogOutIcon className="text-destructive mr-1" /> Logout
    </Button>
  );
}
