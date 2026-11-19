"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import { ChevronLeftIcon, ExternalLinkIcon, Loader2Icon, Maximize2Icon, PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import ToolbarActions from "./ToolbarActions";
import { FilterInput } from "../data-view/features/filtering";
import { useOptionalDataViewCore } from "../data-view/core/stores/DataViewProvider";
import { useBrowserNavigation } from "../screen/stores/useBrowserNavigationStore";
import { EditControls } from "../data-view/features/editing/ui/EditControls";
import { ToolbarActionsMenu } from "./parts/ToolbarActionsMenu";
import { ToolbarCollapseButton } from "./parts/ToolbarCollapse";

export interface TableAction<TData> {
  key: string;
  label: React.ReactNode;
  isEligible?: (row: TData) => boolean;
  onSelect: (rows: TData[]) => void | Promise<void>;
  destructive?: boolean;
}

/**
 * - `overview`: a list page's toolbar, in the page under the view row.
 * - `detail`: a record page's toolbar (its Save and Reload come in as `children`).
 * - `nav`: an embedded list's compact toolbar of small icon buttons.
 */
export type ToolbarVariant = "overview" | "nav" | "detail";

interface ToolbarProps<TData> {
  selectedRows: TData[];
  /**
   * An element id to portal into (embedded lists, relation tabs). Without one the
   * toolbar renders where it is; `false` also renders in place, without its bar.
   */
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
  /** Overview: extra buttons after Delete. Detail: Save and Reload, right after Back. */
  children?: React.ReactNode;
  /** Detail: shown at the end of the bar (the unsaved-changes indicator). */
  trailing?: React.ReactNode;
  popOutUrl?: string;
  preFilters?: FilterInput[];
}

/** Toolbar buttons: 40px touch targets on phones, 32px from `sm` up. */
export const TOOLBAR_BUTTON = "h-10 sm:h-8";

/**
 * A data view's or record's toolbar: Back, then the actions as buttons
 * (Add, Open, Edit, Delete, Refresh, Pop out, Actions ▾), labelled from `sm` up.
 * Each button shows only when its feature and permission allow it.
 */
export function Toolbar<TData>(props: ToolbarProps<TData>) {
  const { variant = "overview", slotId } = props;
  if (variant === "nav") return <NavToolbar {...props} />;

  const content = variant === "detail" ? <DetailToolbar {...props} /> : <OverviewToolbar {...props} />;
  return typeof slotId === "string" ? <ToolbarActions slotId={slotId}>{content}</ToolbarActions> : content;
}

/** The bar itself, for a toolbar not placed in a list's bar. */
function Bar({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className="flex flex-wrap items-center gap-1.5 rounded-[10px] border bg-toolbar p-2 sm:gap-2"
    >
      {children}
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-6 w-px shrink-0 bg-border sm:block" />;
}

function BackButton({ onBack }: { onBack?: () => void }) {
  const t = useTranslations("Toolbar");
  const inner = (
    <>
      <ChevronLeftIcon aria-hidden />
      <span className="hidden sm:inline">{t("back")}</span>
    </>
  );
  return onBack ? (
    <Button type="button" variant="outline" size="sm" aria-label={t("back")} className={TOOLBAR_BUTTON} onClick={onBack}>
      {inner}
    </Button>
  ) : (
    <Button asChild variant="outline" size="sm" className={TOOLBAR_BUTTON}>
      <Link href="/" aria-label={t("back")}>
        {inner}
      </Link>
    </Button>
  );
}

function AddButton({
  addPath,
  onAdd,
  compact,
  iconOnly,
  className,
}: {
  addPath?: string;
  onAdd?: () => void;
  /** Icon only on phones (record toolbars, where Save is the main button). */
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  const t = useTranslations("Toolbar");
  const router = useTransitionRouter();
  return (
    <Button
      type="button"
      size="sm"
      variant={compact || iconOnly ? "outline" : "default"}
      aria-label={t("add")}
      title={t("add")}
      className={className ?? TOOLBAR_BUTTON}
      disabled={router.isPending}
      onClick={() => (onAdd ? onAdd() : addPath && router.push(addPath))}
    >
      {router.isPending ? <Loader2Icon className="animate-spin" aria-hidden /> : <PlusIcon aria-hidden />}
      <span className={iconOnly ? "sr-only" : compact ? "hidden sm:inline" : undefined}>{t("add")}</span>
    </Button>
  );
}

function DeleteButton<TData>({
  selectedRows,
  onDelete,
  isDeleteEligible,
  iconOnly,
  className,
}: {
  selectedRows: TData[];
  onDelete: (rows: TData[]) => void;
  isDeleteEligible?: (row: TData) => boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  const t = useTranslations("Toolbar");
  const eligible = isDeleteEligible ? selectedRows.filter(isDeleteEligible) : selectedRows;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={t("delete")}
      title={t("delete")}
      disabled={eligible.length === 0}
      onClick={() => onDelete(eligible)}
      className={cn(className ?? TOOLBAR_BUTTON, "text-destructive hover:text-destructive")}
    >
      <Trash2Icon aria-hidden />
      <span className={iconOnly ? "sr-only" : "hidden sm:inline"}>{t("delete")}</span>
      {selectedRows.length > 1 && (
        <span className="text-xs tabular-nums opacity-80">
          {eligible.length}/{selectedRows.length}
        </span>
      )}
    </Button>
  );
}

/** Small icon buttons for an embedded list's nav toolbar. */
const NAV_BUTTON = "h-7 px-2";

function RefreshButton({
  onRefresh,
  isRefreshing,
  isRefetching,
  iconOnly,
  className,
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
  isRefetching: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  const t = useTranslations("Toolbar");
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={t("refresh")}
      title={t("refresh")}
      className={className ?? TOOLBAR_BUTTON}
      disabled={isRefreshing}
      onClick={onRefresh}
    >
      {isRefetching ? <Loader2Icon className="animate-spin" aria-hidden /> : <RotateCcwIcon aria-hidden />}
      <span className={iconOnly ? "sr-only" : "hidden sm:inline"}>{t("refresh")}</span>
    </Button>
  );
}

/** Opens the list or record on its own page (shown where it's embedded). */
function PopoutButton({
  popOutUrl,
  preFilters,
  iconOnly,
  className,
}: {
  popOutUrl: string;
  preFilters?: FilterInput[];
  iconOnly?: boolean;
  className?: string;
}) {
  const t = useTranslations("Toolbar");
  const { navigateTo } = useBrowserNavigation();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={t("popout")}
      title={t("popout")}
      className={className ?? TOOLBAR_BUTTON}
      onClick={() => navigateTo(popOutUrl, preFilters && preFilters.length > 0 ? preFilters : undefined)}
    >
      <Maximize2Icon aria-hidden />
      <span className={iconOnly ? "sr-only" : "hidden sm:inline"}>{t("popout")}</span>
    </Button>
  );
}

function OpenButton<TData>({
  selectedRows,
  selectedCount,
  onOpen,
  getRowUrl,
  iconOnly,
  className,
}: {
  selectedRows: TData[];
  selectedCount: number;
  onOpen: (rows: TData[]) => void;
  getRowUrl?: (row: TData) => string;
  iconOnly?: boolean;
  className?: string;
}) {
  const t = useTranslations("Toolbar");
  const openUrl = selectedCount === 1 && getRowUrl ? getRowUrl(selectedRows[0]) : undefined;
  const open = (event: React.MouseEvent) => {
    // A modified click on the link opens the record in a new tab.
    if (openUrl && (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)) return;
    event.preventDefault();
    onOpen(selectedRows);
  };
  const label = <span className={iconOnly ? "sr-only" : "hidden sm:inline"}>{t("open")}</span>;

  if (openUrl) {
    return (
      <Button asChild variant="outline" size="sm" className={className ?? TOOLBAR_BUTTON}>
        <Link href={openUrl} onClick={open} aria-label={t("open")} title={t("open")}>
          <ExternalLinkIcon aria-hidden />
          {label}
        </Link>
      </Button>
    );
  }
  // Several selected: they open one after another (the record page steps through them).
  const title = selectedCount > 1 ? t("openSelectedCount", { count: selectedCount }) : t("open");
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={title}
      title={title}
      className={className ?? TOOLBAR_BUTTON}
      disabled={selectedCount === 0}
      onClick={open}
    >
      <ExternalLinkIcon aria-hidden />
      {label}
      {selectedCount > 1 && <span className="text-xs tabular-nums opacity-80">{selectedCount}</span>}
    </Button>
  );
}

function OverviewToolbar<TData>({
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
  children,
  popOutUrl,
  preFilters,
}: ToolbarProps<TData>) {
  const t = useTranslations("Toolbar");
  const dataView = useOptionalDataViewCore();

  const items = (
    <>
      {/* Back only where there's somewhere to go back from (not in an embedded list). */}
      {onBack && (
        <>
          <BackButton onBack={onBack} />
          <Divider />
        </>
      )}
      {(addPath || onAdd) && <AddButton addPath={addPath} onAdd={onAdd} />}
      {onOpen && (
        <OpenButton selectedRows={selectedRows} selectedCount={selectedCount} onOpen={onOpen} getRowUrl={getRowUrl} />
      )}
      {dataView?.featureIds.has("edit") && <EditControls />}
      {onDelete && <DeleteButton selectedRows={selectedRows} onDelete={onDelete} isDeleteEligible={isDeleteEligible} />}
      {onRefresh && <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} isRefetching={isRefetching} />}
      {popOutUrl && <PopoutButton popOutUrl={popOutUrl} preFilters={preFilters} />}
      {children}
      {!!actions?.length && <ToolbarActionsMenu actions={actions} selectedRows={selectedRows} />}
      {/* In a list on phones, the chevron that opens the rest of the bar, at the end of the row. */}
      {dataView && <ToolbarCollapseButton className="ml-auto" />}
    </>
  );

  // In a list, its bar holds these next to the search, filters and count; elsewhere they get their own.
  return dataView ? items : <Bar label={t("actions")}>{items}</Bar>;
}

function DetailToolbar<TData>({
  selectedRows,
  actions,
  onDelete,
  isDeleteEligible,
  addPath,
  onAdd,
  onBack,
  onRefresh,
  isRefreshing = false,
  isRefetching = false,
  children,
  trailing,
  popOutUrl,
  preFilters,
}: ToolbarProps<TData>) {
  const t = useTranslations("Toolbar");

  const items = (
    <>
      <BackButton onBack={onBack} />
      <Divider />
      {children}
      {/* Icons on phones, so Save keeps its label. */}
      {(addPath || onAdd) && <AddButton addPath={addPath} onAdd={onAdd} compact />}
      {onDelete && <DeleteButton selectedRows={selectedRows} onDelete={onDelete} isDeleteEligible={isDeleteEligible} />}
      {onRefresh && <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} isRefetching={isRefetching} />}
      {popOutUrl && <PopoutButton popOutUrl={popOutUrl} preFilters={preFilters} />}
      {!!actions?.length && <ToolbarActionsMenu actions={actions} selectedRows={selectedRows} compact />}
      {trailing && <div className="flex basis-full items-center sm:ml-auto sm:basis-auto">{trailing}</div>}
    </>
  );

  // The same bar on a record page and in a record panel beside a list.
  return <Bar label={t("recordActions")}>{items}</Bar>;
}

/** Embedded lists: the actions as small icon buttons, Actions ▾ last. */
function NavToolbar<TData>({
  selectedRows,
  selectedCount,
  actions,
  onDelete,
  isDeleteEligible,
  addPath,
  onAdd,
  onOpen,
  onRefresh,
  isRefreshing = false,
  isRefetching = false,
  slotId,
  children,
  popOutUrl,
  preFilters,
}: ToolbarProps<TData>) {
  if (!actions?.length && !onDelete && !addPath && !onAdd && !onOpen && !onRefresh && !children && slotId !== undefined) {
    return null;
  }

  const content = (
    <div className="flex h-full w-full items-center gap-1 px-0">
      {children}
      <div className="ml-auto flex items-center gap-1">
        {(addPath || onAdd) && <AddButton addPath={addPath} onAdd={onAdd} iconOnly className={NAV_BUTTON} />}
        {onOpen && (
          <OpenButton selectedRows={selectedRows} selectedCount={selectedCount} onOpen={onOpen} iconOnly className={NAV_BUTTON} />
        )}
        {onDelete && (
          <DeleteButton
            selectedRows={selectedRows}
            onDelete={onDelete}
            isDeleteEligible={isDeleteEligible}
            iconOnly
            className={NAV_BUTTON}
          />
        )}
        {onRefresh && (
          <RefreshButton
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            isRefetching={isRefetching}
            iconOnly
            className={NAV_BUTTON}
          />
        )}
        {popOutUrl && <PopoutButton popOutUrl={popOutUrl} preFilters={preFilters} iconOnly className={NAV_BUTTON} />}
        {!!actions?.length && <ToolbarActionsMenu actions={actions} selectedRows={selectedRows} className={NAV_BUTTON} />}
      </div>
    </div>
  );

  return typeof slotId === "string" ? <ToolbarActions slotId={slotId}>{content}</ToolbarActions> : content;
}
