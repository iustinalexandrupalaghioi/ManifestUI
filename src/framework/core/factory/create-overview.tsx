"use client";

import DataView from "@/framework/components/data-view/DataView";
import { resolveFeatures } from "@/framework/components/data-view/core/features/resolveFeatures";
import { resolveResourceAction } from "../resource-action-config";
import {
  useOverviewSelection,
  useOverviewState,
} from "@/framework/components/data-view/core/hooks/useOverview";
import { useNavigatorStore } from "@/framework/components/screen/stores/useNavigatorStore";
import { AccessDeniedDialog } from "@/framework/authorization/ui/AccessDeniedDialog";
import { preFilterToFormKey, type FilterInput } from "@/framework/components/data-view/features/filtering";
import { flattenFormFields } from "@/framework/components/form/lib/flattenFormFields";
import Loader from "@/framework/components/partials/Loader";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import { ActionResultError } from "@/framework/lib/actionResult";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { FieldValues } from "react-hook-form";

import type { ResourceId } from "../../types/resource-hook-types";
import type { ResourceHooks } from "../hooks/create-resource-hooks";
import { useOverviewActionsBundle } from "../hooks/useOverviewActionsBundle";
import { getItemId } from "../resource-id";
import { OverviewActionChrome } from "./OverviewActionChrome";
import { SplitOverviewShell } from "./SplitOverviewShell";
import type { OverviewConfig, OverviewProps } from "./create-overview/types";
import { useAutoOpenSplitSelection } from "./create-overview/useAutoOpenSplitSelection";
import { useOverviewColumns } from "./create-overview/useOverviewColumns";
import { useOverviewData } from "./create-overview/useOverviewData";
import { useOverviewNavigation } from "./create-overview/useOverviewNavigation";
import { useOverviewPermissions } from "./create-overview/useOverviewPermissions";
import { renderOverviewSlot } from "@/framework/extensions/renderers";

/** Form values a new record starts with when added from a filtered list (the filter's values). */
function initialValuesFromPreFilters<TFormValues>(preFilters: FilterInput[], formConfig: Parameters<typeof preFilterToFormKey>[1]) {
  if (preFilters.length === 0) return undefined;
  return Object.fromEntries(preFilters.map((f) => [preFilterToFormKey(f, formConfig), f.value])) as Partial<TFormValues>;
}

/**
 * Builds a resource's overview: the data view (grid or cards) with its
 * toolbar, add and detail dialogs, and the split layout. Permissions, data
 * and navigation live in the hooks under ./create-overview; this composes
 * them and renders.
 */
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
    onNavigate?: (id: string) => void;
  }>,
) {
  const { createColumns, overviewKey, dataView, add: addConfig, open: openConfig, delete: deleteConfig } = config;

  const { toolbarEnabled: addToolbarEnabled } = resolveResourceAction(addConfig);
  const { toolbarEnabled: openToolbarEnabled, rowEnabled: openRowEnabled } = resolveResourceAction(openConfig);
  const { toolbarEnabled: deleteToolbarEnabled, rowEnabled: deleteRowEnabled } = resolveResourceAction(deleteConfig);

  const resolvedFeatures = resolveFeatures({ ...dataView?.overview?.features, open: openRowEnabled });
  const editingEnabled = resolvedFeatures.some((f) => f.id === "edit");
  const selectionEnabled = resolvedFeatures.some((f) => f.id === "selection");

  const { idField, keys, routes, labels, openMode, addMode, splitConfig, tabs } = hooks;
  const idOf = (item: TItem) => getItemId(item as Record<string, unknown>, idField);

  return function Overview(props: OverviewProps = {}) {
    return (
      <Suspense fallback={<Loader />}>
        <OverviewInner {...props} />
      </Suspense>
    );
  };

  function OverviewInner({ preFilters: preFiltersProp, slotId, height, popOutUrl }: OverviewProps) {
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

    const { permissionsLoaded, canRead, canAdd, canDelete, canDeleteToolbar, gridEditable } = useOverviewPermissions(
      config.permissions,
      { addToolbar: addToolbarEnabled, deleteRow: deleteRowEnabled, deleteToolbar: deleteToolbarEnabled, editing: editingEnabled },
    );

    const { directFields, pickupFillFields } = useMemo(
      () =>
        flattenFormFields(
          config.formConfig,
          tabs
            .filter((tab): tab is Extract<(typeof tabs)[number], { type: "fields" }> => tab.type === "fields")
            .map((tab) => tab.sections),
        ),
      [],
    );

    const currentPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    const {
      preFilters,
      tableId,
      resolvedViewName,
      tableColumnVisibility,
      cardColumnVisibility,
      editMode,
      pendingChangesDialog,
      sorting,
      activeFilters,
      list,
      aggregates,
      groupAggregates,
      refresh,
    } = useOverviewData({ hooks, config, preFiltersProp, locale, canRead });
    const { allItems, total, isError, error: listError, fetchNextPage, hasNextPage, isFetchingNextPage } = list;

    const [openingItem, setOpeningItem] = useState<TItem | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    const { rowSelection, setRowSelection, dataTableProps } = useOverviewState();

    const isLoading = !permissionsLoaded || list.isLoading;
    const isForbidden =
      (permissionsLoaded && !canRead) ||
      (listError instanceof ActionResultError && listError.error.meta?.type === "forbidden");

    const { selectedRows } = useOverviewSelection(allItems, rowSelection, idField);
    const slotContext = { items: allItems, total, selectedRows };

    useAutoOpenSplitSelection({
      isSplitDesktop,
      isLoading,
      allItems,
      openingItem,
      idField,
      splitOnOpen: splitConfig.onOpen,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
      overviewKey,
      currentPath,
      setOpeningItem,
      setNavigator,
    });

    // The record open beside the list was deleted (or filtered out): close it rather than
    // keep showing it, once the list has reloaded.
    useEffect(() => {
      if (!openingItem || list.isFetching || isLoading) return;
      const openId = idOf(openingItem).toString();
      if (!allItems.some((item) => idOf(item).toString() === openId)) setOpeningItem(null);
    }, [openingItem, allItems, list.isFetching, isLoading]);

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
      splitOnOpen: splitConfig.onOpen,
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
      selectionEnabled,
      openEnabled: openRowEnabled,
      directFields,
      pickupFillFields,
      handleOpen,
      openDeleteDialog,
      getRowUrl,
      isDeleteEligible,
      actions,
    });

    if (isForbidden) return <AccessDeniedDialog resource={resolvedLabels.plural} />;
    if (isError) return <div>Error loading {resolvedLabels.plural.toLowerCase()}</div>;

    const activeRowId = isSplitDesktop && openingItem ? idOf(openingItem).toString() : undefined;

    // The toolbar joins the list's own tools in one bar inside the data view, on a list page
    // and in an embedded list (a relation tab, a layout `list`) alike; custom overviews place
    // ToolbarNode themselves. An embedded list has no Back: it isn't a page.
    const inPageToolbar = !config.renderOverview;

    const chromeNode = (
      <OverviewActionChrome
        slotId={inPageToolbar ? undefined : slotId}
        variant={inPageToolbar ? "overview" : slotId ? "nav" : "overview"}
        idField={idField}
        selectedRows={selectedRows}
        actions={actions}
        getRowUrl={getRowUrl}
        isDeleteEligible={canDeleteToolbar ? isDeleteEligible : () => false}
        deleteToolbarEnabled={canDeleteToolbar}
        onOpen={canRead && openToolbarEnabled ? (rows) => handleOpen(rows) : undefined}
        onAdd={canAdd ? handleAdd : undefined}
        onBack={slotId ? undefined : () => router.back()}
        setRowSelection={setRowSelection}
        preFilters={preFilters}
        popOutUrl={popOutUrl}
        toolbarChildren={renderOverviewSlot(config.overviewSlots?.toolbarExtra, slotContext, (fn) => fn(selectedRows))}
        onRefresh={refresh}
        isRefreshing={list.isFetching}
        isRefetching={list.isRefetching}
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

    // Grid editing: saves edited rows in one batch, and opens a row's detail form for pickups.
    const tableMeta = gridEditable
      ? {
          updateManyAsync: (items: { id: ResourceId; data: Record<string, unknown> }[]) =>
            // The row (with its edits) as form values: the row may be keyed differently (camelCase).
            updateManyAsync(items.map((item) => ({ id: item.id, data: hooks.toFormValues(item.data as TItem) }))),
          getRecordId: (original: TItem) => idOf(original),
          useDetailForm: hooks.useDetailForm,
        }
      : undefined;

    const tableNode = (
      <DataView
        features={resolvedFeatures}
        dataTableConfig={dataView?.dataTable}
        slotId={slotId}
        toolbar={inPageToolbar ? chromeNode : undefined}
        tableMeta={tableMeta}
        isLoading={isLoading}
        defaultViewName={resolvedViewName}
        tableId={tableId}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        getRowId={(row) => idOf(row).toString()}
        totalCount={total}
        columns={columns}
        height={height}
        initialColumnVisibility={tableColumnVisibility}
        initialListColumnVisibility={cardColumnVisibility}
        data={allItems}
        preFilters={preFilters}
        activeRowId={activeRowId}
        openOnRowClick={isSplitDesktop && !editMode}
        aggregateValues={aggregates.data}
        isAggregatesFetching={aggregates.isFetching}
        groupAggregateRows={groupAggregates.data}
        isGroupAggregatesFetching={groupAggregates.isFetching}
        {...dataTableProps}
      />
    );

    const addDialogNode =
      canAdd && addMode === "dialog" && addOpen ? (
        <AddDialog
          open={addOpen}
          setOpen={setAddOpen}
          initial={initialValuesFromPreFilters<TFormValues>(preFilters, config.formConfig)}
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
        {renderOverviewSlot(config.overviewSlots?.beforeToolbar, slotContext, (fn) => fn(allItems, total))}
        {!inPageToolbar && chromeNode}
        {renderOverviewSlot(config.overviewSlots?.afterToolbar, slotContext, (fn) => fn(allItems, total))}
        {tableNode}
        {renderOverviewSlot(config.overviewSlots?.afterTable, slotContext, (fn) => fn(allItems))}
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
          main={<div className="my-2 flex max-h-full w-full flex-col">{mainContent}</div>}
          detail={
            activeRowId ? (
              <DetailPage
                key={activeRowId}
                id={activeRowId}
                onClose={() => setOpeningItem(null)}
                onNavigate={(navId) => {
                  const item = allItems.find((i) => idOf(i).toString() === navId);
                  if (item) setOpeningItem(item);
                }}
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
            key={idOf(openingItem)}
            item={openingItem}
            open={!!openingItem}
            setOpen={(o) => !o && setOpeningItem(null)}
          />
        )}
      </div>
    );
  }
}
