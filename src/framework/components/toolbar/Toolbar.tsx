"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/framework/lib/utils";
import { ChevronLeftIcon, MoreHorizontal } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import ToolbarActions from "./ToolbarActions";
import { FilterInput } from "../data-view/features/filtering";
import { ToolbarMenuItems } from "./parts/ToolbarMenuItems";
import { ToolbarOpenButton } from "./parts/ToolbarOpenButton";
import { useIsNarrow } from "./parts/useIsNarrow";

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
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isRefetching?: boolean;
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

/**
 * A data view's toolbar. The overview and detail variants show Back and
 * Open buttons with everything else in a "More" menu; the compact nav
 * variant (embedded lists) puts all of it in the menu.
 */
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
  onRefresh,
  isRefreshing = false,
  isRefetching = false,
  slotId,
  variant = "overview",
  children,
  popOutUrl,
  preFilters,
}: ToolbarProps<TData>) {
  const t = useTranslations("Toolbar");
  const isNarrow = useIsNarrow();

  if (
    !actions?.length &&
    !onDelete &&
    !addPath &&
    !onAdd &&
    !onOpen &&
    !onRefresh &&
    !onBack &&
    !children &&
    slotId !== undefined
  ) {
    return null;
  }

  const styles = VARIANT_STYLES[variant];
  const wrap = (content: React.ReactNode) =>
    slotId === false ? content : <ToolbarActions slotId={slotId}>{content}</ToolbarActions>;

  const menuItems = {
    selectedRows,
    selectedCount,
    popOutUrl,
    preFilters,
    addPath,
    onAdd,
    onRefresh,
    isRefreshing,
    isRefetching,
    actions,
    isNarrow,
    onDelete,
    isDeleteEligible,
  };

  if (variant === "nav") {
    const hasPrimaryItems = !!(onOpen || addPath || onAdd || onRefresh || onDelete);
    const menuHasContent = hasPrimaryItems || !!actions?.length;

    return wrap(
      <div className={cn("flex h-full w-full items-center", styles.gap, styles.padding)}>
        {children}

        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" type="button" className={styles.button} disabled={!menuHasContent}>
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
              <ToolbarMenuItems {...menuItems} onOpen={onOpen} separateActions={hasPrimaryItems} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>,
    );
  }

  const showBack = onBack || !slotId;
  const hasMenu = addPath || onAdd || onRefresh || onDelete || !!actions?.length || popOutUrl;

  return wrap(
    <div className={cn("flex h-full w-full items-center", styles.gap, slotId !== false && styles.padding)}>
      {/* Left group */}
      <div className={cn("flex items-center", styles.gap)}>
        {showBack &&
          (onBack ? (
            <Button title={t("back")} type="button" variant="outline" size="icon" className={styles.button} onClick={onBack}>
              <ChevronLeftIcon className={styles.icon} />
            </Button>
          ) : (
            <Link href="/">
              <Button title={t("back")} type="button" variant="outline" size="icon">
                <ChevronLeftIcon className={styles.icon} />
              </Button>
            </Link>
          ))}

        {onOpen && (
          <ToolbarOpenButton
            onOpen={onOpen}
            selectedRows={selectedRows}
            selectedCount={selectedCount}
            canOpen={selectedCount > 0}
            openUrl={selectedCount === 1 && getRowUrl ? getRowUrl(selectedRows[0]) : undefined}
            styles={styles}
          />
        )}

        {children}
      </div>

      <div className={cn(slotId === false ? "flex items-center" : "ml-auto flex items-center", styles.gap)}>
        {hasMenu && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={styles.labeled ? "sm" : "icon"} type="button" className={styles.button}>
                <MoreHorizontal className={styles.icon} />
                {styles.labeled && t("more")}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-fit" align="end">
              <ToolbarMenuItems {...menuItems} separateActions={!!(addPath || onAdd || onRefresh || popOutUrl)} />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>,
  );
}
