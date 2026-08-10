"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import { cn } from "@/framework/lib/utils";
import {
  ChevronLeftIcon,
  ExternalLinkIcon,
  FileSearch,
  Loader2Icon,
  MoreHorizontal,
  Plus,
  RotateCcwIcon,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import ToolbarActions from "./ToolbarActions";
import { useState, useEffect } from "react";
import { FilterInput } from "../data-view/features/filtering";
import { useBrowserNavigation } from "../screen/stores/useBrowserNavigationStore";

export interface TableAction<TData> {
  // Stable identifier, gated as `${resourceId}:${key}` alongside the
  // built-in CRUD verbs — see create-actions-hooks.ts.
  key: string;
  label: React.ReactNode;
  isEligible?: (row: TData) => boolean;
  onSelect: (rows: TData[]) => void | Promise<void>;
  destructive?: boolean;
}

export type ToolbarVariant = "overview" | "nav" | "detail";

interface ToolbarProps<TData> {
  selectedRows: TData[];
  slotId?: string;
  variant?: ToolbarVariant;
  selectedCount: number;
  actions?: TableAction<TData>[];
  onDelete?: (rows: TData[]) => void;
  isDeleteEligible?: (row: TData) => boolean;
  addPath?: string;
  onAdd?: () => void;
  onBack?: () => void;
  onOpen?: (rows: TData[]) => void;
  getRowUrl?: (row: TData) => string;
  reloadEnabled?: boolean;
  setRowSelection: (selection: Record<string, boolean>) => void;
  children?: React.ReactNode;
  popOutUrl?: string;
  preFilters?: FilterInput[];
}

const VARIANT_STYLES: Record<
  ToolbarVariant,
  {
    button?: string;
    icon: string;
    gap: string;
    padding: string;
    labeled: boolean;
  }
> = {
  overview: {
    button: undefined,
    icon: "size-4",
    gap: "gap-1 md:gap-4",
    padding: "px-2 md:px-4",
    labeled: false,
  },
  detail: {
    button: undefined,
    icon: "size-4",
    gap: "gap-1 md:gap-4 ",
    padding: "px-2 md:px-4",
    labeled: false,
  },
  nav: {
    button: "h-7 px-2 gap-1",
    icon: "size-3",
    gap: "gap-1",
    padding: "px-0",
    labeled: true,
  },
};

export function Toolbar<TData>({
  selectedRows,
  selectedCount,
  actions,
  onDelete,
  isDeleteEligible,
  addPath,
  onAdd,
  onBack,
  onOpen,
  getRowUrl,
  reloadEnabled = false,
  slotId,
  variant = "overview",
  children,
  popOutUrl,
  preFilters,
}: ToolbarProps<TData>) {
  const t = useTranslations("Toolbar");
  const tc = useTranslations("Common");
  const router = useTransitionRouter();
  const [isNarrow, setIsNarrow] = useState(false);
  const { navigateTo } = useBrowserNavigation();
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (
    !actions?.length &&
    !onDelete &&
    !addPath &&
    !onAdd &&
    !onOpen &&
    !onBack &&
    !children &&
    slotId !== undefined
  ) {
    return null;
  }

  const styles = VARIANT_STYLES[variant];
  const canOpen = selectedCount > 0;
  const openUrl =
    selectedCount === 1 && getRowUrl ? getRowUrl(selectedRows[0]) : undefined;

  const eligibleForDelete = isDeleteEligible
    ? selectedRows.filter(isDeleteEligible)
    : selectedRows;

  const countEligibleActions = (
    actions: TableAction<TData>[],
    selectedRows: TData[],
  ) => {
    return actions.reduce((count, action) => {
      const eligible = selectedRows.filter(
        (r) => action.isEligible?.(r) ?? true,
      );

      return eligible.length > 0 ? count + 1 : count;
    }, 0);
  };

  const eligibleCount = actions
    ? countEligibleActions(actions, selectedRows)
    : 0;

  const showBack = onBack || !slotId;

  // --- Dedicated render path for the "nav" variant: everything collapses ---
  // --- into a single "Actions" menu, with custom actions as a submenu.   ---
  if (variant === "nav") {
    const hasPrimaryItems = !!(
      onOpen ||
      addPath ||
      onAdd ||
      reloadEnabled ||
      onDelete
    );
    const hasCustomActions = !!actions?.length;
    const menuHasContent = hasPrimaryItems || hasCustomActions;

    return (
      <ToolbarActions slotId={slotId}>
        <div
          className={cn(
            "flex h-full w-full items-center",
            styles.gap,
            styles.padding,
          )}
        >
          {children}

          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className={styles.button}
                  disabled={!menuHasContent}
                >
                  <MoreHorizontal className={styles.icon} />
                  {t("more")}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="w-fit"
                align="start"
                sideOffset={2}
                alignOffset={-4}
              >
                {onOpen && (
                  <DropdownMenuItem
                    disabled={!canOpen}
                    onSelect={() => onOpen(selectedRows)}
                  >
                    <FileSearch className="size-4" />
                    {selectedCount > 1 ? t("openCount", { count: selectedCount }) : t("open")}
                  </DropdownMenuItem>
                )}

                {popOutUrl && (
                  <DropdownMenuItem
                    onClick={() =>
                      navigateTo(
                        popOutUrl,
                        preFilters && preFilters.length > 0
                          ? preFilters
                          : undefined,
                      )
                    }
                  >
                    <ExternalLinkIcon className="size-4" /> {t("popout")}
                  </DropdownMenuItem>
                )}

                {(addPath || onAdd) && (
                  <DropdownMenuItem
                    disabled={router.isPending}
                    onSelect={() => {
                      if (onAdd) onAdd();
                      else if (addPath) router.push(addPath);
                    }}
                  >
                    {router.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {t("add")}
                  </DropdownMenuItem>
                )}

                {reloadEnabled && (
                  <DropdownMenuItem onSelect={() => window.location.reload()}>
                    <RotateCcwIcon className="size-4" />
                    {t("refresh")}
                  </DropdownMenuItem>
                )}

                {hasCustomActions && (
                  <>
                    {hasPrimaryItems && <DropdownMenuSeparator />}
                    {isNarrow ? (
                      <>
                        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                        {actions!.map((action, i) => {
                          const eligible = selectedRows.filter(
                            (r) => action.isEligible?.(r) ?? true,
                          );

                          if (eligible.length === 0) return null;

                          return (
                            <DropdownMenuItem
                              key={i}
                              onSelect={() => action.onSelect(eligible)}
                            >
                              {action.label}

                              {selectedCount > 1 && (
                                <span className="ml-1 text-muted-foreground">
                                  ({eligible.length}/{selectedCount})
                                </span>
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </>
                    ) : (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                          disabled={selectedCount === 0 || eligibleCount === 0}
                          className={cn(
                            (selectedCount === 0 || eligibleCount === 0) &&
                              "pointer-events-none opacity-50",
                          )}
                        >
                          <Settings className="size-4" />
                          {t("actions")}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent
                            className="w-fit"
                            align="start"
                            sideOffset={2}
                            alignOffset={-4}
                          >
                            {actions!.map((action, i) => {
                              const eligible = selectedRows.filter(
                                (r) => action.isEligible?.(r) ?? true,
                              );

                              if (eligible.length === 0) return null;

                              return (
                                <DropdownMenuItem
                                  key={i}
                                  onSelect={() => action.onSelect(eligible)}
                                >
                                  {action.label}

                                  {selectedCount > 1 && (
                                    <span className="ml-1 text-muted-foreground">
                                      ({eligible.length}/{selectedCount})
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    )}
                  </>
                )}

                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={eligibleForDelete.length === 0}
                      onSelect={() => onDelete(eligibleForDelete)}
                    >
                      <Trash2 className="size-4" />
                      {tc("delete")}
                      {selectedCount > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                          {eligibleForDelete.length}/{selectedCount}
                        </span>
                      )}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ToolbarActions>
    );
  }

  return (
    <ToolbarActions slotId={slotId}>
      <div
        className={cn(
          "flex h-full w-full items-center",
          styles.gap,
          styles.padding,
        )}
      >
        {/* Left group */}
        <div className={cn("flex items-center", styles.gap)}>
          {showBack &&
            (onBack ? (
              <Button
                title={t("back")}
                type="button"
                variant="outline"
                size="icon"
                className={styles.button}
                onClick={onBack}
              >
                <ChevronLeftIcon className={styles.icon} />
              </Button>
            ) : (
              <Link href="/">
                <Button
                  title={t("back")}
                  type="button"
                  variant="outline"
                  size="icon"
                >
                  <ChevronLeftIcon className={styles.icon} />
                </Button>
              </Link>
            ))}

          {onOpen &&
            (() => {
              const isMulti = selectedCount > 1;

              const handleClick = (e: React.MouseEvent) => {
                const isModified =
                  e.metaKey ||
                  e.ctrlKey ||
                  e.shiftKey ||
                  e.altKey ||
                  e.button !== 0;
                if (openUrl && isModified) return;
                e.preventDefault();
                onOpen(selectedRows);
              };

              const button = (
                <Button
                  title={
                    isMulti
                      ? t("openSelectedCount", { count: selectedCount })
                      : t("open")
                  }
                  variant="outline"
                  type="button"
                  size={isMulti || styles.labeled ? "sm" : "icon"}
                  className={isMulti ? undefined : styles.button}
                  disabled={!canOpen}
                  onClick={handleClick}
                >
                  <FileSearch className={cn(styles.icon, "shrink-0")} />
                  {styles.labeled && t("open")}
                  {isMulti && (
                    <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                      {selectedCount}
                    </span>
                  )}
                </Button>
              );

              return openUrl ? <Link href={openUrl}>{button}</Link> : button;
            })()}

          {children}
        </div>

        {/* Right group — pushed to the end */}
        <div className={cn("ml-auto flex items-center", styles.gap)}>
          {(addPath ||
            onAdd ||
            reloadEnabled ||
            onDelete ||
            !!actions?.length ||
            popOutUrl) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size={styles.labeled ? "sm" : "icon"}
                  type="button"
                  className={styles.button}
                >
                  <MoreHorizontal className={styles.icon} />
                  {styles.labeled && t("more")}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="w-fit"
                align="end"
              >
                {popOutUrl && (
                  <DropdownMenuItem
                    onClick={() =>
                      navigateTo(
                        popOutUrl,
                        preFilters && preFilters.length > 0
                          ? preFilters
                          : undefined,
                      )
                    }
                  >
                    <ExternalLinkIcon className="size-4" />
                    {t("popout")}
                  </DropdownMenuItem>
                )}

                {(addPath || onAdd) && (
                  <DropdownMenuItem
                    disabled={router.isPending}
                    onSelect={() => {
                      if (onAdd) onAdd();
                      else if (addPath) router.push(addPath);
                    }}
                  >
                    {router.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {t("add")}
                  </DropdownMenuItem>
                )}

                {reloadEnabled && (
                  <DropdownMenuItem onSelect={() => window.location.reload()}>
                    <RotateCcwIcon className="size-4" />
                    {t("refresh")}
                  </DropdownMenuItem>
                )}

                {!!actions?.length && (
                  <>
                    {(addPath || onAdd || reloadEnabled || popOutUrl) && (
                      <DropdownMenuSeparator />
                    )}
                    {isNarrow ? (
                      <>
                        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                        {actions.map((action, i) => {
                          const eligible = selectedRows.filter(
                            (r) => action.isEligible?.(r) ?? true,
                          );
                          if (eligible.length === 0) return null;
                          return (
                            <DropdownMenuItem
                              key={i}
                              onSelect={() => action.onSelect(eligible)}
                            >
                              {action.label}
                              {selectedCount > 1 && (
                                <span className="ml-1 text-muted-foreground">
                                  ({eligible.length}/{selectedCount})
                                </span>
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </>
                    ) : (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                          disabled={selectedCount === 0 || eligibleCount === 0}
                          className={cn(
                            (selectedCount === 0 || eligibleCount === 0) &&
                              "pointer-events-none opacity-50",
                          )}
                        >
                          <Settings className="size-4" />
                          {t("actions")}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent
                            className="w-fit"
                            align="start"
                            sideOffset={2}
                            alignOffset={-4}
                          >
                            {actions.map((action, i) => {
                              const eligible = selectedRows.filter(
                                (r) => action.isEligible?.(r) ?? true,
                              );
                              if (eligible.length === 0) return null;
                              return (
                                <DropdownMenuItem
                                  key={i}
                                  onSelect={() => action.onSelect(eligible)}
                                >
                                  {action.label}
                                  {selectedCount > 1 && (
                                    <span className="ml-1 text-muted-foreground">
                                      ({eligible.length}/{selectedCount})
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    )}
                  </>
                )}

                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={eligibleForDelete.length === 0}
                      onSelect={() => onDelete(eligibleForDelete)}
                    >
                      <Trash2 className="size-4" />
                      {tc("delete")}
                      {selectedCount > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                          {eligibleForDelete.length}/{selectedCount}
                        </span>
                      )}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </ToolbarActions>
  );
}
