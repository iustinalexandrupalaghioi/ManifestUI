"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import {
  ChevronDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import { useFormPageContext } from "../../page/FormPage";

export interface FormHeaderCollapsibleProps {
  title: string;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  prevPath?: string;
  nextPath?: string;
  positionLabel?: string;
  guard?: (fn: () => void) => void;
  firstPath?: string;
  lastPath?: string;
  isAddScreen?: boolean;
}

export function FormHeaderCollapsible({
  title,
  children,
  className,
  triggerClassName,
  isOpen,
  setOpen,
  prevPath,
  nextPath,
  positionLabel,
  guard,
  firstPath,
  lastPath,
  isAddScreen,
}: FormHeaderCollapsibleProps) {
  const hasNav = prevPath !== undefined || nextPath !== undefined;
  const router = useTransitionRouter();
  const t = useTranslations("Pagination");
  const tr = useTranslations("Resource");

  const formPage = (() => {
    try {
      return useFormPageContext();
    } catch {
      return null;
    }
  })();
  const effectiveGuard = guard ?? formPage?.guard;

  // Always replace — keeps the history stack at a single detail-page
  // entry no matter how many times Prev/Next/First/Last are clicked.
  const go = (path: string) => {
    if (effectiveGuard) effectiveGuard(() => router.replace(path));
    else router.replace(path);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setOpen}
      className={cn("flex flex-col", className)}
    >
      <div
        className={cn(
          "sticky top-0 z-10 mb-4 flex w-full items-center bg-background py-1",
          triggerClassName,
        )}
      >
        <CollapsibleTrigger className="flex cursor-pointer items-center gap-2">
          <span className="font-semibold text-primary">{title}</span>
          {isAddScreen && (
            <span className="text-muted">{tr("newItemBadge")}</span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </CollapsibleTrigger>

        <div className="flex-1" />

        {hasNav && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={!firstPath || router.isPending}
              title={t("first")}
              type="button"
              onClick={() => firstPath && go(firstPath)}
            >
              <ChevronsLeftIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!prevPath || router.isPending}
              title={t("previous")}
              type="button"
              onClick={() => prevPath && go(prevPath)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            {positionLabel && (
              <span className="flex min-w-12 items-center justify-center text-center text-xs text-muted-foreground tabular-nums">
                {positionLabel}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              disabled={!nextPath || router.isPending}
              title={t("next")}
              type="button"
              onClick={() => nextPath && go(nextPath)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!lastPath || router.isPending}
              title={t("last")}
              type="button"
              onClick={() => lastPath && go(lastPath)}
            >
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
