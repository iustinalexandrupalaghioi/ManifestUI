"use client";

import { createActionsColumn } from "@/framework/components/data-view/core/ui/createActionsColumn";
import { createBufferColumn } from "@/framework/components/data-view/core/ui/createBufferColumn";
import { createSelectionColumn } from "@/framework/components/data-view/core/ui/createSelectionColumn";
import DataView from "@/framework/components/data-view/DataView";
import {
  useOverviewSelection,
  useOverviewState,
} from "@/framework/components/data-view/core/hooks/useOverview";
import { useActiveMode } from "@/framework/components/data-view/core/stores/ViewModeStore";
import { getFilteringStore } from "@/framework/components/data-view/features/filtering/filtering.store";
import { getSortingStore } from "@/framework/components/data-view/features/sorting/sorting.store";
import {
  getViewsStore,
  useActiveListView,
  useActiveTableView,
} from "@/framework/components/data-view/features/views/views.store";
import {
  DEFAULT_LIST_VIEW_ID,
  DEFAULT_TABLE_VIEW_ID,
} from "@/framework/components/data-view/features/views/views.types";
import { useNavigatorStore } from "@/framework/components/screen/stores/useNavigatorStore";

import {
  preFilterToFormKey,
  type FilterInput,
  type FilterOperator,
  type FilterRule,
} from "@/framework/components/data-view/features/filtering";
import { toFilterRuleFallback } from "@/framework/components/data-view/features/filtering/filters";
import type { Row } from "@tanstack/react-table";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useSearchParams, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import { stashNavigationState } from "@/framework/lib/navigationHandoff";
import type { OverviewSlots } from "../../types/define-resource-type";
import type {
  OverviewRenderProps,
  ResourceComponentsConfig,
} from "../../types/resource-components-types";
import type { ResourceId } from "../../types/resource-hook-types";
import type { ResourceHooks } from "../hooks/create-resource-hooks";
import { getItemId } from "../resource-id";
import { resolvePermission } from "@/framework/lib/resolvePermissions";
import { usePermissions } from "@/framework/authorization/usePermissions";
import { ActionResultError } from "@/framework/lib/actionResult";
import { AccessDeniedDialog } from "@/framework/authorization/AccessDeniedDialog";
import { useOverviewActionsBundle } from "../hooks/useOerviewActionsBundle";
import { OverviewActionChrome } from "./OverviewActionChrome";

type OverviewConfig<TItem, TFormValues> = ResourceComponentsConfig<
  TItem,
  TFormValues
> & {
  overviewSlots?: OverviewSlots<TItem>;
  renderOverview?: (props: OverviewRenderProps<TItem>) => React.ReactNode;
  getOverviewTitle?: (preFilters: FilterInput[]) => string;
};

const NO_VALUE_OPERATORS = [
  "is_true",
  "is_false",
  "is_empty",
  "is_not_empty",
] as const;

function OverviewSkeleton() {
  return (
    <div className="flex h-40 w-full items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export function createOverview<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  hooks: ResourceHooks<TItem, TFormValues, TId>,
  config: OverviewConfig<TItem, TFormValues>,
  AddDialog: React.ComponentType<{
    open: boolean;
    setOpen: (o: boolean) => void;
    initial?: Partial<TFormValues>;
  }>,
  DetailDialog: React.ComponentType<{
    item: TItem;
    open: boolean;
    setOpen: (o: boolean) => void;
  }>,
) {
  const {
    createColumns,
    overviewKey,
    defaultViewName,
    columnVisibility,
    navigationColumnVisibility,
    cardNavigationColumnVisibility,
    listColumnVisibility,
  } = config;

  const { idField, keys, routes, labels, openMode, addMode } = hooks;

  return function Overview(
    props: {
      preFilters?: FilterInput[];
      slotId?: string;
      height?: number;
      popOutUrl?: string;
    } = {},
  ) {
    return (
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewInner {...props} />
      </Suspense>
    );
  };

  function OverviewInner({
    preFilters: preFiltersProp,
    slotId,
    height,
    popOutUrl,
  }: {
    preFilters?: FilterInput[];
    slotId?: string;
    height?: number;
    popOutUrl?: string;
  }) {
    const router = useTransitionRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const setNavigator = useNavigatorStore((s) => s.set);
    const clearNavigator = useNavigatorStore((s) => s.clear);

    const locale = useLocale();
    const resolvedLabels = {
      singular: resolveLabel(labels.singular, locale),
      plural: resolveLabel(labels.plural, locale),
      new: resolveLabel(labels.new, locale),
      gender: labels.gender,
    };

    // Subscribes this component to the permissions query so it re-renders
    // once Providers seeds the real data — resolvePermission below reads a
    // plain synchronous cache snapshot and has no way to trigger a re-render
    // on its own. `isSuccess` also lets the list query below skip straight to
    // "access denied" once permissions are known, instead of firing (and
    // waiting on) a fetch it already knows the server will reject.
    const { isSuccess: permissionsLoaded } = usePermissions();

    const canRead = resolvePermission(config.permissions?.read);
    const canAdd = resolvePermission(config.permissions?.add);
    const canDelete = resolvePermission(config.permissions?.delete);

    const currentPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    const urlPreFilters = useMemo<FilterInput[]>(() => {
      const entries = [...searchParams.entries()];
      if (entries.length === 0) return [];

      return entries.reduce<FilterInput[]>((acc, [key, raw]) => {
        const dotIndex = key.indexOf(".");
        const columnName = dotIndex > -1 ? key.slice(dotIndex + 1) : key;
        const origin = dotIndex > -1 ? key.slice(0, dotIndex) : undefined;

        if (NO_VALUE_OPERATORS.includes(raw as any)) {
          acc.push({
            columnName,
            origin,
            operator: raw as FilterOperator,
            value: null,
          });
          return acc;
        }

        const pipeIndex = raw.indexOf("|");
        if (pipeIndex === -1) {
          acc.push({ columnName, origin, operator: "equals", value: raw });
          return acc;
        }

        const operator = raw.slice(0, pipeIndex) as FilterOperator;
        const rawValue = raw.slice(pipeIndex + 1);

        const isKnownOperator = [
          "contains",
          "not_contains",
          "equals",
          "not_equals",
          "gt",
          "gte",
          "lt",
          "lte",
          "is_any_of",
        ].includes(operator);

        if (!isKnownOperator) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[createOverview] urlPreFilters: unknown operator "${operator}" in param "${key}=${raw}" — dropping it.`,
            );
          }
          return acc;
        }

        if (rawValue === "") {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[createOverview] urlPreFilters: missing value in param "${key}=${raw}" — dropping it.`,
            );
          }
          return acc;
        }

        const value: FilterInput["value"] =
          operator === "is_any_of" ? rawValue.split(",") : rawValue;

        acc.push({ columnName, origin, operator, value });
        return acc;
      }, []);
    }, [searchParams]);

    const preFilters = preFiltersProp ?? urlPreFilters;

    const listFilter = useMemo(
      () =>
        preFilters.length > 0
          ? Object.fromEntries(preFilters.map((f) => [f.columnName, f.value]))
          : undefined,
      [preFilters],
    );

    const tableId = listFilter
      ? `${overviewKey}-${JSON.stringify(listFilter)}`
      : overviewKey;

    const resolvedViewName =
      config.getOverviewTitle?.(preFilters) ??
      resolveLabel(defaultViewName, locale);

    getViewsStore(
      tableId,
      resolvedViewName,
      listFilter && navigationColumnVisibility
        ? navigationColumnVisibility
        : (columnVisibility ?? {}),
      listFilter && cardNavigationColumnVisibility
        ? cardNavigationColumnVisibility
        : (listColumnVisibility ?? {}),
    );

    // getViewsStore only names the default view on first creation — it won't
    // pick up a later locale switch on its own (the store outlives the
    // locale it was created under, and persists to localStorage). The
    // default view is never user-renamable (see TableViewBar/ListViewBar),
    // so it's always safe to keep it in sync with the current locale here.
    useEffect(() => {
      const store = getViewsStore(tableId);
      const { tableViews, listViews } = store.getState().persisted;
      const tableDefault = tableViews.views.find(
        (v) => v.id === DEFAULT_TABLE_VIEW_ID,
      );
      const listDefault = listViews.views.find(
        (v) => v.id === DEFAULT_LIST_VIEW_ID,
      );
      if (tableDefault && tableDefault.name !== resolvedViewName) {
        store.getState().renameTableView(DEFAULT_TABLE_VIEW_ID, resolvedViewName);
      }
      if (listDefault && listDefault.name !== resolvedViewName) {
        store.getState().renameListView(DEFAULT_LIST_VIEW_ID, resolvedViewName);
      }
    }, [tableId, resolvedViewName]);

    const activeMode = useActiveMode(tableId);
    const activeTableView = useActiveTableView(tableId);
    const activeCardView = useActiveListView(tableId);

    const tableViewId = activeTableView?.id ?? DEFAULT_TABLE_VIEW_ID;
    const cardViewId = activeCardView?.id ?? DEFAULT_LIST_VIEW_ID;
    const activeViewId = activeMode === "list" ? cardViewId : tableViewId;

    const sorting = getSortingStore(tableId, activeViewId)((s) => s.sorting);
    const userFilters = getFilteringStore(
      tableId,
      activeViewId,
    )((s) => s.rules);

    const activeFilters = useMemo<FilterRule[]>(
      () => [...preFilters.map(toFilterRuleFallback), ...userFilters],
      [preFilters, userFilters],
    );

    const [openingItem, setOpeningItem] = useState<TItem | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    const handleAdd = () => {
      if (!canAdd) return;
      if (addMode === "dialog") {
        setAddOpen(true);
      } else {
        if (preFilters.length > 0) {
          stashNavigationState(
            routes.add,
            Object.fromEntries(
              preFilters.map((f) => [
                preFilterToFormKey(f, config.formConfig),
                f.value,
              ]),
            ),
          );
        }
        router.push(routes.add);
      }
    };

    const { rowSelection, setRowSelection, dataTableProps } =
      useOverviewState();

    const {
      allItems,
      total,
      isError,
      error: listError,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading: listIsLoading,
    } = hooks.useList(sorting, activeFilters, canRead);

    // The list query is deliberately `enabled: canRead`, and canRead fails
    // closed (false) until permissions actually resolve — so a disabled
    // query's own isLoading is false the whole time permissions are
    // unknown, not just once denial is confirmed. Left as query.isLoading
    // alone, that's false identically on the server's first render and the
    // client's pre-hydration render (both start with unresolved
    // permissions), so hydration matches — but it then flips to "no
    // results" before permissions (and therefore canRead) are actually
    // known, which is wrong, and the *subsequent* client render (once
    // permissions resolve and the query enables) flips again to true,
    // producing the hydration-mismatch flash this replaces.
    const isLoading = !permissionsLoaded || listIsLoading;

    const isForbidden =
      (permissionsLoaded && !canRead) ||
      (listError instanceof ActionResultError &&
        listError.error.meta?.type === "forbidden");

    const { selectedRows, selectedCount } = useOverviewSelection(
      allItems,
      rowSelection,
      idField,
    );

    const handleOpen = (items: TItem[]) => {
      const item = items[0];
      if (!item) return;
      const targetRoute = routes.detail(
        getItemId(item as Record<string, unknown>, idField).toString(),
      );

      if (
        openMode === "dialog" &&
        items.length === 1 &&
        selectedRows.length <= 1
      ) {
        setOpeningItem(item);
      } else {
        const isMultiSelection = selectedRows.length > 1 || items.length > 1;
        if (isMultiSelection) {
          const navigatorIds =
            selectedRows.length > 1
              ? selectedRows.map((i) =>
                  getItemId(i as Record<string, unknown>, idField).toString(),
                )
              : items.map((i) =>
                  getItemId(i as Record<string, unknown>, idField).toString(),
                );
          setNavigator(navigatorIds, overviewKey, currentPath);
        } else {
          clearNavigator(overviewKey);
        }
        router.push(targetRoute);
      }
    };

    const {
      actions,
      getRowUrl,
      isDeleteEligible,
      removeAsync,
      error,
      clearError,
      deleteOpen,
      setDeleteOpen,
      pendingDeleteItems,
      openDeleteDialog,
      activeActionForm,
      activeActionItems,
      activeActionKey,
      closeActionForm,
      bulkResult,
      clearBulkResult,
      confirmDialog,
    } = useOverviewActionsBundle(
      hooks,
      selectedRows,
      () => setRowSelection({}),
      canRead ? (item: TItem) => handleOpen([item]) : () => {},
    );

    const columns = useMemo(
      () => [
        createSelectionColumn<TItem>(),
        createActionsColumn<TItem>({
          onOpen: canRead
            ? (rows) => handleOpen(rows.map((r) => r.original))
            : undefined,
          onDelete: canDelete
            ? (rows) => openDeleteDialog(rows.map((r) => r.original))
            : undefined,
          getRowUrl: getRowUrl ? (row) => getRowUrl(row.original) : undefined,
          isDeleteEligible: canDelete
            ? (row) => isDeleteEligible(row.original)
            : () => false,
          actions: () =>
            actions.map((action) => ({
              label: action.label,
              isEligible: action.isEligible
                ? (row: Row<TItem>) => action.isEligible!(row.original)
                : undefined,
              onSelect: (rows: Row<TItem>[]) =>
                action.onSelect(rows.map((r) => r.original)),
            })),
        }),
        ...(createColumns?.(locale) ?? []),
        createBufferColumn<TItem>(),
      ],
      [getRowUrl, handleOpen, isDeleteEligible, actions, canRead, canDelete, locale],
    );

    if (isForbidden)
      return <AccessDeniedDialog resource={resolvedLabels.plural} />;

    if (isError)
      return <div>Error loading {resolvedLabels.plural.toLowerCase()}</div>;

    const chromeNode = (
      <OverviewActionChrome
        slotId={slotId}
        variant={slotId ? "nav" : "overview"}
        idField={idField}
        selectedRows={selectedRows}
        actions={actions}
        getRowUrl={getRowUrl}
        isDeleteEligible={canDelete ? isDeleteEligible : () => false}
        onOpen={canRead ? (rows) => handleOpen(rows) : undefined}
        onAdd={canAdd ? handleAdd : undefined}
        onBack={slotId ? undefined : () => router.back()}
        setRowSelection={setRowSelection}
        preFilters={preFilters}
        popOutUrl={popOutUrl}
        toolbarChildren={config.overviewSlots?.toolbarExtra?.(selectedRows)}
        routes={routes}
        queryKeyAll={keys.all}
        labels={resolvedLabels}
        deleteOpen={deleteOpen}
        setDeleteOpen={setDeleteOpen}
        pendingDeleteItems={pendingDeleteItems}
        openDeleteDialog={openDeleteDialog}
        removeAsync={removeAsync}
        activeActionForm={activeActionForm}
        activeActionItems={activeActionItems}
        activeActionKey={activeActionKey}
        closeActionForm={closeActionForm}
        error={error}
        clearError={clearError}
        bulkResult={bulkResult}
        clearBulkResult={clearBulkResult}
        confirmDialog={confirmDialog}
      />
    );

    const tableNode = (
      <DataView
        slotId={slotId}
        isLoading={isLoading}
        defaultViewName={resolvedViewName}
        tableId={tableId}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        getRowId={(row) =>
          getItemId(row as Record<string, unknown>, idField).toString()
        }
        totalCount={total}
        columns={columns}
        height={height}
        initialColumnVisibility={
          listFilter && navigationColumnVisibility
            ? navigationColumnVisibility
            : columnVisibility
        }
        initialListColumnVisibility={
          listFilter && cardNavigationColumnVisibility
            ? cardNavigationColumnVisibility
            : listColumnVisibility
        }
        data={allItems}
        preFilters={preFilters}
        {...dataTableProps}
      />
    );

    const addDialogNode =
      canAdd && addMode === "dialog" && addOpen ? (
        <AddDialog
          open={addOpen}
          setOpen={setAddOpen}
          initial={
            preFilters.length > 0
              ? (Object.fromEntries(
                  preFilters.map((f) => [
                    preFilterToFormKey(f, config.formConfig),
                    f.value,
                  ]),
                ) as Partial<TFormValues>)
              : undefined
          }
        />
      ) : null;

    if (config.renderOverview) {
      return config.renderOverview({
        data: allItems,
        total,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        rowSelection,
        setRowSelection,
        selectedRows,
        sorting,
        filters: activeFilters,
        Table: tableNode,
        ToolbarNode: chromeNode,
        AddDialogNode: addDialogNode,
        DeleteDialogNode: null,
      });
    }

    return (
      <div className="my-2 flex max-h-full w-full flex-col">
        {config.overviewSlots?.beforeToolbar?.(allItems, total)}
        {chromeNode}
        {config.overviewSlots?.afterToolbar?.(allItems, total)}
        {tableNode}
        {config.overviewSlots?.afterTable?.(allItems)}
        {openMode === "dialog" && openingItem && (
          <DetailDialog
            key={getItemId(openingItem as Record<string, unknown>, idField)}
            item={openingItem}
            open={!!openingItem}
            setOpen={(o) => !o && setOpeningItem(null)}
          />
        )}
        {addDialogNode}
      </div>
    );
  }
}
