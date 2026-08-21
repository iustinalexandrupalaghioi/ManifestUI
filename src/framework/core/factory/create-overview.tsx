"use client";

import DataView from "@/framework/components/data-view/DataView";
import {
  useOverviewSelection,
  useOverviewState,
} from "@/framework/components/data-view/core/hooks/useOverview";
import { useActiveMode } from "@/framework/components/data-view/core/stores/ViewModeStore";
import { getFilteringStore } from "@/framework/components/data-view/features/filtering/filtering.store";
import { getSortingStore } from "@/framework/components/data-view/features/sorting/sorting.store";
import { getAggregatesStore } from "@/framework/components/data-view/features/aggregates/aggregates.store";
import { getGroupingStore } from "@/framework/components/data-view/features/grouping/grouping.store";
import { unionGroupAggregateRules } from "@/framework/components/data-view/features/grouping/grouping";
import {
  useActiveListView,
  useActiveTableView,
} from "@/framework/components/data-view/features/views/views.store";
import {
  DEFAULT_LIST_VIEW_ID,
  DEFAULT_TABLE_VIEW_ID,
} from "@/framework/components/data-view/features/views/views.types";
import { useNavigatorStore } from "@/framework/components/screen/stores/useNavigatorStore";
import { usePendingChanges } from "@/framework/hooks/usePendingChanges";

import {
  preFilterToFormKey,
  type FilterInput,
  type FilterRule,
} from "@/framework/components/data-view/features/filtering";
import { toFilterRuleFallback } from "@/framework/components/data-view/features/filtering/filters";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import type { OverviewSlots } from "../../types/define-resource-type";
import type {
  OverviewRenderProps,
  ResourceComponentsConfig,
} from "../../types/resource-components-types";
import type { ResourceId } from "../../types/resource-hook-types";
import type { ResourceHooks } from "../hooks/create-resource-hooks";
import { getItemId } from "../resource-id";
import { resolvePermission } from "@/framework/lib/resolvePermissions";
import { usePermissions } from "@/framework/authorization/hooks/usePermissions";
import { ActionResultError } from "@/framework/lib/actionResult";
import { AccessDeniedDialog } from "@/framework/authorization/ui/AccessDeniedDialog";
import { useOverviewActionsBundle } from "../hooks/useOerviewActionsBundle";
import { OverviewActionChrome } from "./OverviewActionChrome";
import { flattenFormFields } from "@/framework/components/form/lib/flattenFormFields";
import { getEditingStore } from "@/framework/components/data-view/features/editing/editing.store";
import { SplitOverviewShell } from "./SplitOverviewShell";
import { useIsMobile } from "@/hooks/use-mobile";
import { OverviewSkeleton } from "./create-overview/OverviewSkeleton";
import { parseUrlPreFilters } from "./create-overview/parseUrlPreFilters";
import { useAutoOpenSplitSelection } from "./create-overview/useAutoOpenSplitSelection";
import { useOverviewColumns } from "./create-overview/useOverviewColumns";
import { useOverviewViewsSync } from "./create-overview/useOverviewViewsSync";
import { useOverviewNavigation } from "./create-overview/useOverviewNavigation";

type OverviewConfig<TItem, TFormValues> = ResourceComponentsConfig<
  TItem,
  TFormValues
> & {
  overviewSlots?: OverviewSlots<TItem>;
  renderOverview?: (props: OverviewRenderProps<TItem>) => React.ReactNode;
  getOverviewTitle?: (preFilters: FilterInput[]) => string;
};

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
  DetailPage: React.ComponentType<{
    id?: string;
    onClose?: () => void;
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

  const {
    idField,
    keys,
    routes,
    labels,
    openMode,
    addMode,
    splitConfig,
    tabs,
  } = hooks;

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

    const isMobile = useIsMobile();
    const isSplitDesktop = openMode === "split" && !isMobile;

    const locale = useLocale();
    const resolvedLabels = {
      singular: resolveLabel(labels.singular, locale),
      plural: resolveLabel(labels.plural, locale),
      new: resolveLabel(labels.new, locale),
      gender: labels.gender,
    };

    const { isSuccess: permissionsLoaded } = usePermissions();

    const canRead = resolvePermission(config.permissions?.read);
    const canAdd = resolvePermission(config.permissions?.add);
    const canDelete = resolvePermission(config.permissions?.delete);
    const canUpdate = resolvePermission(config.permissions?.update);
    const gridEditable = canUpdate && config.editable === true;

    const { directFields, pickupFillFields } = useMemo(
      () =>
        flattenFormFields(
          config.formConfig,
          tabs
            .filter(
              (
                tab,
              ): tab is Extract<(typeof tabs)[number], { type: "fields" }> =>
                tab.type === "fields",
            )
            .map((tab) => tab.sections),
        ),
      [],
    );

    const currentPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    const urlPreFilters = useMemo<FilterInput[]>(
      () => parseUrlPreFilters(searchParams),
      [searchParams],
    );

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

    const editMode = getEditingStore(tableId)((s) => s.editMode);
    const pendingEdits = getEditingStore(tableId)((s) => s.pendingEdits);
    const gridIsDirty = Object.keys(pendingEdits).length > 0;
    const { guard: guardRefresh, pendingChangesDialog } =
      usePendingChanges(gridIsDirty);

    const resolvedViewName =
      config.getOverviewTitle?.(preFilters) ??
      resolveLabel(defaultViewName, locale);

    useOverviewViewsSync(
      tableId,
      resolvedViewName,
      listFilter && navigationColumnVisibility
        ? navigationColumnVisibility
        : (columnVisibility ?? {}),
      listFilter && cardNavigationColumnVisibility
        ? cardNavigationColumnVisibility
        : (listColumnVisibility ?? {}),
    );

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

    const activeAggregateRules = getAggregatesStore(
      tableId,
      activeViewId,
    )((s) => s.rules);
    const {
      data: aggregateValues,
      isFetching: isAggregatesFetching,
      refetch: refetchAggregates,
    } = hooks.useAggregates(activeAggregateRules, activeFilters);

    const activeGrouping = getGroupingStore(
      tableId,
      activeViewId,
    )((s) => s.grouping);
    const groupAggregateRules = useMemo(
      () => unionGroupAggregateRules(activeGrouping),
      [activeGrouping],
    );
    const {
      data: groupAggregateRows,
      isFetching: isGroupAggregatesFetching,
      refetch: refetchGroupAggregates,
    } = hooks.useGroupAggregates(
      groupAggregateRules,
      activeFilters,
      activeGrouping,
    );

    const [openingItem, setOpeningItem] = useState<TItem | null>(null);
    const [addOpen, setAddOpen] = useState(false);

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
      isFetching: isRefreshing,
      isRefetching,
      refetch,
    } = hooks.useList(sorting, activeFilters, activeGrouping, canRead);

    const onRefresh = () =>
      guardRefresh(() => {
        getEditingStore(tableId).getState().discardAll();
        refetch();
        refetchAggregates();
        refetchGroupAggregates();
      });

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

    useAutoOpenSplitSelection({
      isSplitDesktop,
      isLoading,
      allItems,
      openingItem,
      idField,
      splitOnOpen: splitConfig.onOpen,
      setOpeningItem,
      setRowSelection,
    });

    const { handleAdd, handleOpen } = useOverviewNavigation<TItem>({
      canAdd,
      addMode,
      preFilters,
      formConfig: config.formConfig,
      addRoute: routes.add,
      detailRoute: routes.detail,
      router,
      setAddOpen,
      isSplitDesktop,
      selectedRows,
      idField,
      openMode,
      overviewKey,
      currentPath,
      clearNavigator,
      setNavigator,
      setOpeningItem,
    });

    const {
      actions,
      getRowUrl,
      isDeleteEligible,
      removeAsync,
      updateManyAsync,
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

    const columns = useOverviewColumns<TItem>({
      createColumns,
      locale,
      canRead,
      canDelete,
      gridEditable,
      directFields,
      pickupFillFields,
      handleOpen,
      openDeleteDialog,
      getRowUrl,
      isDeleteEligible,
      actions,
    });

    if (isForbidden)
      return <AccessDeniedDialog resource={resolvedLabels.plural} />;

    if (isError)
      return <div>Error loading {resolvedLabels.plural.toLowerCase()}</div>;

    const activeRowId =
      isSplitDesktop && openingItem
        ? getItemId(openingItem as Record<string, unknown>, idField).toString()
        : undefined;

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
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        isRefetching={isRefetching}
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

    const tableMeta = gridEditable
      ? {
          updateManyAsync: (
            items: { id: ResourceId; data: Record<string, unknown> }[],
          ) =>
            updateManyAsync(
              items.map((item) => ({
                id: item.id,
                data: item.data as TFormValues,
              })),
            ),
          getRecordId: (original: TItem) =>
            getItemId(original as Record<string, unknown>, idField),
          useDetailForm: hooks.useDetailForm,
        }
      : undefined;

    const tableNode = (
      <DataView
        slotId={slotId}
        tableMeta={tableMeta}
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
        activeRowId={activeRowId}
        openOnRowClick={isSplitDesktop && !editMode}
        aggregateValues={aggregateValues}
        isAggregatesFetching={isAggregatesFetching}
        groupAggregateRows={groupAggregateRows}
        isGroupAggregatesFetching={isGroupAggregatesFetching}
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

    const mainContent = (
      <>
        {config.overviewSlots?.beforeToolbar?.(allItems, total)}
        {chromeNode}
        {config.overviewSlots?.afterToolbar?.(allItems, total)}
        {tableNode}
        {config.overviewSlots?.afterTable?.(allItems)}
        {addDialogNode}
        {pendingChangesDialog}
      </>
    );

    if (isSplitDesktop) {
      return (
        <SplitOverviewShell
          open={!!openingItem}
          onOpenChange={(o) => !o && setOpeningItem(null)}
          splitConfig={splitConfig}
          main={
            <div className="my-2 flex max-h-full w-full flex-col">
              {mainContent}
            </div>
          }
          detail={
            activeRowId ? (
              <DetailPage
                key={activeRowId}
                id={activeRowId}
                onClose={() => setOpeningItem(null)}
              />
            ) : null
          }
        />
      );
    }

    return (
      <div className="my-2 flex max-h-full w-full flex-col">
        {mainContent}
        {openMode === "dialog" && openingItem && (
          <DetailDialog
            key={getItemId(openingItem as Record<string, unknown>, idField)}
            item={openingItem}
            open={!!openingItem}
            setOpen={(o) => !o && setOpeningItem(null)}
          />
        )}
      </div>
    );
  }
}
