"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/framework/lib/utils";
import { ChevronLeftIcon, ExternalLinkIcon, Loader2Icon, MoreHorizontal, PlusIcon, Trash2Icon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import ToolbarActions from "./ToolbarActions";
import { FilterInput } from "../data-view/features/filtering";
import { useOptionalDataViewCore } from "../data-view/core/stores/DataViewProvider";
import { EditControls } from "../data-view/features/editing/ui/EditControls";
import { ToolbarMenuItems } from "./parts/ToolbarMenuItems";
import { ToolbarActionsMenu } from "./parts/ToolbarActionsMenu";
import { useIsNarrow } from "./parts/useIsNarrow";

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
 * - `nav`: an embedded list's compact toolbar, everything in a "More" menu.
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
 * A data view's or record's toolbar: Back, then the actions as labelled
 * buttons (Add, Open, Edit, Delete, Actions ▾) and ⋯ for the rest.
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

function AddButton({ addPath, onAdd }: { addPath?: string; onAdd?: () => void }) {
  const t = useTranslations("Toolbar");
  const router = useTransitionRouter();
  return (
    <Button
      type="button"
      size="sm"
      className={TOOLBAR_BUTTON}
      disabled={router.isPending}
      onClick={() => (onAdd ? onAdd() : addPath && router.push(addPath))}
    >
      {router.isPending ? <Loader2Icon className="animate-spin" aria-hidden /> : <PlusIcon aria-hidden />}
      {t("add")}
    </Button>
  );
}

function DeleteButton<TData>({
  selectedRows,
  onDelete,
  isDeleteEligible,
}: {
  selectedRows: TData[];
  onDelete: (rows: TData[]) => void;
  isDeleteEligible?: (row: TData) => boolean;
}) {
  const t = useTranslations("Toolbar");
  const eligible = isDeleteEligible ? selectedRows.filter(isDeleteEligible) : selectedRows;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={t("delete")}
      disabled={eligible.length === 0}
      onClick={() => onDelete(eligible)}
      className={cn(TOOLBAR_BUTTON, "text-destructive hover:text-destructive")}
    >
      <Trash2Icon aria-hidden />
      <span className="hidden sm:inline">{t("delete")}</span>
      {selectedRows.length > 1 && (
        <span className="text-xs tabular-nums opacity-80">
          {eligible.length}/{selectedRows.length}
        </span>
      )}
    </Button>
  );
}

function MoreMenu({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm" aria-label={label} title={label} className={cn("size-10 sm:size-8", className)}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} className="w-fit" align="end">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
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
  const isNarrow = useIsNarrow();
  const dataView = useOptionalDataViewCore();
  const hasMore = !!(onRefresh || popOutUrl);

  const openUrl = selectedCount === 1 && getRowUrl ? getRowUrl(selectedRows[0]) : undefined;
  const open = (event: React.MouseEvent) => {
    // A modified click on the link opens the record in a new tab.
    if (openUrl && (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)) return;
    event.preventDefault();
    onOpen?.(selectedRows);
  };

  const items = (
    <>
      <BackButton onBack={onBack} />
      <Divider />
      {(addPath || onAdd) && <AddButton addPath={addPath} onAdd={onAdd} />}
      {onOpen &&
        (openUrl ? (
          <Button asChild variant="outline" size="sm" className={TOOLBAR_BUTTON}>
            <Link href={openUrl} onClick={open} aria-label={t("open")}>
              <ExternalLinkIcon aria-hidden />
              <span className="hidden sm:inline">{t("open")}</span>
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={t("open")}
            className={TOOLBAR_BUTTON}
            disabled={selectedCount !== 1}
            onClick={open}
          >
            <ExternalLinkIcon aria-hidden />
            <span className="hidden sm:inline">{t("open")}</span>
          </Button>
        ))}
      {dataView?.featureIds.has("editing") && <EditControls />}
      {onDelete && <DeleteButton selectedRows={selectedRows} onDelete={onDelete} isDeleteEligible={isDeleteEligible} />}
      {children}
      {!!actions?.length && <ToolbarActionsMenu actions={actions} selectedRows={selectedRows} />}
      {hasMore && (
        <MoreMenu label={t("more")} className="ml-auto sm:ml-0">
          <ToolbarMenuItems
            selectedRows={selectedRows}
            selectedCount={selectedCount}
            popOutUrl={popOutUrl}
            preFilters={preFilters}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            isRefetching={isRefetching}
            isNarrow={isNarrow}
            separateActions={false}
          />
        </MoreMenu>
      )}
    </>
  );

  // In a list, its bar holds these next to the search, filters and count; elsewhere they get their own.
  return dataView ? items : <Bar label={t("actions")}>{items}</Bar>;
}

function DetailToolbar<TData>({
  selectedRows,
  selectedCount,
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
  slotId,
}: ToolbarProps<TData>) {
  const t = useTranslations("Toolbar");
  const isNarrow = useIsNarrow();
  const hasAdd = !!(addPath || onAdd);
  // Phones: Add and Delete go into ⋯ to leave room for Save.
  const moreHasItems = !!(onRefresh || popOutUrl || (isNarrow && (hasAdd || onDelete)));

  const items = (
    <>
      <BackButton onBack={onBack} />
      <Divider />
      {children}
      {!isNarrow && hasAdd && <AddButton addPath={addPath} onAdd={onAdd} />}
      {!isNarrow && onDelete && (
        <DeleteButton selectedRows={selectedRows} onDelete={onDelete} isDeleteEligible={isDeleteEligible} />
      )}
      {!!actions?.length && <ToolbarActionsMenu actions={actions} selectedRows={selectedRows} />}
      {moreHasItems && (
        <MoreMenu label={t("more")}>
          <ToolbarMenuItems
            selectedRows={selectedRows}
            selectedCount={selectedCount}
            popOutUrl={popOutUrl}
            preFilters={preFilters}
            addPath={isNarrow ? addPath : undefined}
            onAdd={isNarrow ? onAdd : undefined}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            isRefetching={isRefetching}
            isNarrow={isNarrow}
            onDelete={isNarrow ? onDelete : undefined}
            isDeleteEligible={isDeleteEligible}
            separateActions={false}
          />
        </MoreMenu>
      )}
      {trailing && <div className="flex basis-full items-center sm:ml-auto sm:basis-auto">{trailing}</div>}
    </>
  );

  // `false`: placed inside another bar (the split view's title bar).
  return slotId === false ? (
    <div className="flex flex-wrap items-center gap-1.5">{items}</div>
  ) : (
    <Bar label={t("recordActions")}>{items}</Bar>
  );
}

/** Embedded lists: everything in one "More" menu. */
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
  const t = useTranslations("Toolbar");
  const isNarrow = useIsNarrow();

  if (!actions?.length && !onDelete && !addPath && !onAdd && !onOpen && !onRefresh && !children && slotId !== undefined) {
    return null;
  }

  const hasPrimaryItems = !!(onOpen || addPath || onAdd || onRefresh || onDelete);
  const menuHasContent = hasPrimaryItems || !!actions?.length;

  const content = (
    <div className="flex h-full w-full items-center gap-1 px-0">
      {children}

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" type="button" className="h-7 gap-1 px-2" disabled={!menuHasContent}>
              <MoreHorizontal className="size-3" />
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
            <ToolbarMenuItems
              selectedRows={selectedRows}
              selectedCount={selectedCount}
              popOutUrl={popOutUrl}
              preFilters={preFilters}
              addPath={addPath}
              onAdd={onAdd}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
              isRefetching={isRefetching}
              actions={actions}
              isNarrow={isNarrow}
              onDelete={onDelete}
              isDeleteEligible={isDeleteEligible}
              onOpen={onOpen}
              separateActions={hasPrimaryItems}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return typeof slotId === "string" ? <ToolbarActions slotId={slotId}>{content}</ToolbarActions> : content;
}
