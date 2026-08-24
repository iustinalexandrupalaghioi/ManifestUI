"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import { useFormPageContext } from "../../page/FormPage";

export interface FormHeaderProps {
  children: ReactNode;
  className?: string;
  prevPath?: string;
  nextPath?: string;
  firstPath?: string;
  lastPath?: string;
  positionLabel?: string;
  guard?: (fn: () => void) => void;
  toolbar?: ReactNode;
  onNavigate?: (path: string) => void;
}

export function FormHeader({
  children,
  className,
  prevPath,
  nextPath,
  firstPath,
  lastPath,
  positionLabel,
  guard,
  toolbar,
  onNavigate,
}: FormHeaderProps) {
  const hasNav = prevPath !== undefined || nextPath !== undefined;
  const router = useTransitionRouter();
  const t = useTranslations("Pagination");

  const formPage = (() => {
    try {
      return useFormPageContext();
    } catch {
      return null;
    }
  })();
  const effectiveGuard = guard ?? formPage?.guard;

  const go = (path: string) => {
    const action = onNavigate
      ? () => onNavigate(path)
      : () => router.replace(path);
    if (effectiveGuard) effectiveGuard(action);
    else action();
  };

  return (
    <div className="sticky top-0 z-20 mb-2 flex flex-col bg-background">
      {toolbar && <div className="h-10 shrink-0">{toolbar}</div>}
      <div
        className={cn(
          "flex items-center justify-between bg-background py-1",
          className,
        )}
      >
        <h1 className="font-semibold text-primary">{children}</h1>

        {hasNav && (
          <div className="flex items-center">
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
    </div>
  );
}
