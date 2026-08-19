"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Trash2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import ToolbarActions from "./ToolbarActions";
import { useState, useEffect } from "react";
import { FilterInput } from "../data-view/features/filtering";
import { useBrowserNavigation } from "../screen/stores/useBrowserNavigationStore";
import { ToolbarActionsList } from "./parts/ToolbarActionsList";
import { ToolbarOpenButton } from "./parts/ToolbarOpenButton";

export interface TableAction<TData> {
  key: string;
  label: React.ReactNode;
  isEligible?: (row: TData) => boolean;
  onSelect: (rows: TData[]) => void | Promise<void>;
  destructive?: boolean;
}

export type ToolbarVariant = "overview" | "nav" | "detail";

interface ToolbarProps<TData> {
  selectedRows: TData[];
  slotId?: string | false;
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

    const navContent = (
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
                  {selectedCount > 1
                    ? t("openCount", { count: selectedCount })
                    : t("open")}
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
                  <ToolbarActionsList
                    actions={actions!}
                    selectedRows={selectedRows}
                    selectedCount={selectedCount}
                    eligibleCount={eligibleCount}
                    isNarrow={isNarrow}
                  />
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
    );

    return slotId === false ? (
      navContent
    ) : (
      <ToolbarActions slotId={slotId}>{navContent}</ToolbarActions>
    );
  }

  const content = (
    <div
      className={cn(
        "flex h-full w-full items-center",
        styles.gap,
        slotId !== false && styles.padding,
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

        {onOpen && (
          <ToolbarOpenButton
            onOpen={onOpen}
            selectedRows={selectedRows}
            selectedCount={selectedCount}
            canOpen={canOpen}
            openUrl={openUrl}
            styles={styles}
          />
        )}

        {children}
      </div>

      <div
        className={cn(
          slotId === false ? "flex items-center" : "ml-auto flex items-center",
          styles.gap,
        )}
      >
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
                  <ToolbarActionsList
                    actions={actions}
                    selectedRows={selectedRows}
                    selectedCount={selectedCount}
                    eligibleCount={eligibleCount}
                    isNarrow={isNarrow}
                  />
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
  );

  return slotId === false ? (
    content
  ) : (
    <ToolbarActions slotId={slotId}>{content}</ToolbarActions>
  );
}
