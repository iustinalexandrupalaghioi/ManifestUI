"use client";

import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useRef } from "react";
import { usePersistedState } from "@/framework/lib/usePersistedState";
import { useIsNarrow } from "../../../toolbar/parts/useIsNarrow";
import type { FilterInput } from "../../features/filtering/filters";
import { useCellContextMenuFilter } from "../../features/filtering/useFiltering";
import type { AggregateResult } from "../../features/aggregates/aggregates";
import { buildDefaultAggregateRules } from "../../features/aggregates/useAggregatableColumns";
import { buildDefaultGrouping } from "../../features/grouping/useGroupableColumns";
import type { GroupAggregateRow } from "../../features/grouping/grouping";
import { getViewsStore } from "../../features/views/views.store";
import type { DataViewFeature } from "../contracts";
import type { DataTableConfig } from "../types";
import type { ResolvedViewDefaults } from "../../features/views/viewDefaults";
import { useCoreStore } from "../stores/DataViewStore";
import "../tanstack-augmentations";
import { useAvailableHeight } from "./useAvailableHeight";
import { useColumnHandlers } from "./useColumnHandler";
import { useColumnState } from "./useColumnState";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useScrollFreeze } from "./useScrollFreeze";
import { useSelectionSync } from "./useSelectionSync";
import { groupingChangeHandler, useGroupColumn } from "./useGroupColumn";
import { useColumnSizeVars, useDataViewStoresCleanup, useFeatureHooks } from "./useDataViewLifecycle";
import { SYSTEM_COLUMN_IDS } from "../systemColumns";

export interface DataViewProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  isLoading: boolean;
  rowSelection: Record<string, boolean>;
  setRowSelection: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  getRowId?: (row: TData) => string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  height?: number;
  initialColumnVisibility?: VisibilityState;
  tableId: string;
  defaultViewName?: string;
  quickSearchEnabled?: boolean;
  slotId?: string;
  /** The page's action toolbar; the list's tools join it in one bar (see DataViewLayout). */
  toolbar?: import("react").ReactNode;
  preFilters?: FilterInput[];
  initialListColumnVisibility?: VisibilityState;
  tableMeta?: import("@tanstack/react-table").TableMeta<TData>;
  activeRowId?: string;
  openOnRowClick?: boolean;
  aggregateValues?: AggregateResult;
  isAggregatesFetching?: boolean;
  groupAggregateRows?: GroupAggregateRow[];
  isGroupAggregatesFetching?: boolean;
  dataTableConfig?: DataTableConfig;
  /** Initial state of the built-in default view (see `resolveViewDefaults`). */
  viewDefaults?: ResolvedViewDefaults;
}

export function useDataView<TData, TValue>(
  props: DataViewProps<TData, TValue>,
  features: DataViewFeature[],
) {
  const {
    columns,
    data,
    rowSelection,
    setRowSelection,
    getRowId,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    height: fixedHeight,
    initialColumnVisibility = {},
    tableId,
    defaultViewName = "Default",
    initialListColumnVisibility,
    tableMeta,
    aggregateValues,
    isAggregatesFetching,
    groupAggregateRows,
    isGroupAggregatesFetching,
    dataTableConfig: dataTableConfigProp,
    viewDefaults,
  } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<import("@tanstack/react-table").Table<TData>>(null!);
  const staticColumnIds = useRef<Set<string>>(new Set());
  const columnSizeVarsRef = useRef<HTMLDivElement>(null);

  const featureIds = useMemo(
    () => new Set(features.map((f) => f.id)),
    [features],
  );

  const dataTableConfig = useMemo(
    () => ({
      alternateRowColor: dataTableConfigProp?.alternateRowColor ?? true,
    }),
    [dataTableConfigProp?.alternateRowColor],
  );

  // ── Initialise stores ────────────────────────────────────────────────────
  getViewsStore(
    tableId,
    defaultViewName,
    initialColumnVisibility,
    initialListColumnVisibility ?? {},
    buildDefaultAggregateRules(columns),
    buildDefaultGrouping(columns),
    viewDefaults,
  );

  useSelectionSync(tableId, rowSelection, setRowSelection);

  // ── Column state + sorting ───────────────────────────────────────────────
  const {
    columnVisibility,
    columnSizing,
    columnOrder,
    columnPinning,
    sorting,
    grouping,
    tableViewId,
    listViewId,
    activeMode,
  } = useColumnState(tableId, initialColumnVisibility);

  const groupingIds = useMemo(
    () => (featureIds.has("grouping") ? grouping.map((g) => g.columnId) : []),
    [grouping, featureIds],
  );

  const [expanded, setExpanded] = usePersistedState<ExpandedState>(
    `dv-expanded:${tableId}:${activeMode === "list" ? listViewId : tableViewId}`,
    {},
  );

  // ── Column change handlers ───────────────────────────────────────────────
  const columnHandlers = useColumnHandlers(
    tableId,
    {
      columnVisibility,
      columnSizing,
      columnOrder,
      columnPinning,
      sorting,
      tableViewId,
      listViewId,
    },
    tableRef,
  );

  // ── Global filter ────────────────────────────────────────────────────────
  const globalFilter = useCoreStore(tableId, (s) => s.globalFilter);
  const setGlobalFilter = useCoreStore(tableId, (s) => s.setGlobalFilter);

  // ── Grouping ──────────────────────────────────────────────────────────────
  const onGroupingChange = groupingChangeHandler({ tableId, grouping, groupingIds, tableRef, tableViewId, listViewId });

  // ── Group column ─────────────────────────────────────────────────────────
  const groupColumn = useGroupColumn(tableRef);

  const tableColumns = useMemo(
    () => [groupColumn, ...columns],
    [groupColumn, columns],
  );

  // ── Pinning ──────────────────────────────────────────────────────────────
  // The system columns (checkbox, ⋯) are always pinned. On phones, a view that
  // pins nothing itself also keeps its first column in place while scrolling sideways.
  const isNarrow = useIsNarrow();
  const userPinned = featureIds.has("pinning")
    ? columnPinning.left.filter((id) => !SYSTEM_COLUMN_IDS.includes(id))
    : [];
  const firstDataColumnId = useMemo(() => {
    const ids =
      columnOrder.length > 0
        ? columnOrder
        : columns.map((column) => column.id ?? ("accessorKey" in column ? String(column.accessorKey) : undefined));
    return ids.find(
      (id): id is string => !!id && !SYSTEM_COLUMN_IDS.includes(id) && columnVisibility[id] !== false,
    );
  }, [columnOrder, columns, columnVisibility]);
  const pinnedLeft =
    isNarrow && userPinned.length === 0 && firstDataColumnId ? [firstDataColumnId] : userPinned;

  // ── TanStack table ───────────────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns: tableColumns,
    enableColumnResizing: featureIds.has("resizing"),
    columnResizeMode: "onChange",
    defaultColumn: { enableResizing: featureIds.has("resizing") },
    manualPagination: true,
    groupedColumnMode: false,
    autoResetExpanded: false,
    enableRowSelection: (row) => !row.getIsGrouped(),
    getRowId: getRowId ?? ((_, index) => String(index)),
    state: {
      rowSelection,
      grouping: groupingIds,
      columnVisibility: {
        ...columnVisibility,
        group: groupingIds.length > 0,
        columns: featureIds.has("open") || featureIds.has("columnManager"),
      },
      columnSizing,
      columnPinning: {
        left: [...SYSTEM_COLUMN_IDS, ...pinnedLeft],
      },
      columnOrder:
        columnOrder.length > 0
          ? [
              ...SYSTEM_COLUMN_IDS,
              ...columnOrder.filter((id) => !SYSTEM_COLUMN_IDS.includes(id)),
            ]
          : undefined,
      sorting,
      globalFilter,
      expanded,
    },
    onRowSelectionChange: setRowSelection,
    onGroupingChange,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(globalFilter) : updater;
      setGlobalFilter(next);
    },
    meta: tableMeta,
    ...columnHandlers,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  // Keep tableRef current so useColumnHandlers can read it lazily
  tableRef.current = table;

  // ── Cell context menu filter ─────────────────────────────────────────────
  useCellContextMenuFilter(
    tableId,
    () => {
      const viewsState = getViewsStore(tableId).getState().persisted;
      const activeMode = viewsState.listViews.activeViewId;
      return activeMode === tableRef.current.options.meta
        ? viewsState.listViews.activeViewId
        : viewsState.tableViews.activeViewId;
    },
    (viewId: string) =>
      getViewsStore(tableId)
        .getState()
        .persisted.tableViews.views.some((v) => v.id === viewId),
  );

  // ── Column size vars ─────────────────────────────────────────────────────
  useColumnSizeVars(table, tableId);

  // ── Layout ───────────────────────────────────────────────────────────────
  const autoHeight = useAvailableHeight(
    fixedHeight !== undefined ? { current: null } : scrollContainerRef,
  );
  const height = fixedHeight ?? autoHeight;

  const isResizing = useCoreStore(tableId, (s) => s.isResizing);
  const handleScroll = useScrollFreeze(scrollContainerRef, isResizing);

  // ── Feature registry loop ────────────────────────────────────────────────
  useFeatureHooks(features, tableId, table);

  // ── Infinite scroll ──────────────────────────────────────────────────────
  useInfiniteScroll(loadMoreRef, scrollContainerRef, {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: activeMode,
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useDataViewStoresCleanup(tableId);

  // ── Contexts ──────────────────────────────────────────────────────────────
  const coreCtx = useMemo(
    () => ({
      table,
      tableId,
      scrollContainerRef,
      handleScroll,
      viewType: "table" as const,
      staticColumnIds,
      featureIds,
      columnSizeVarsRef,
      dataTableConfig,
    }),
    [table, tableId, handleScroll, featureIds, dataTableConfig],
  );

  const layoutCtx = useMemo(
    () => ({ height, isResizing }),
    [height, isResizing],
  );

  return {
    table,
    coreCtx,
    layoutCtx,
    scrollContainerRef,
    loadMoreRef,
    handleScroll,
    height,
    isResizing,
    globalFilter,
    setGlobalFilter,
    activeMode,
    sorting,
    tableViewId,
    listViewId,
    columnVisibility,
    columnSizing,
    columnOrder,
    columnPinning,
    aggregateValues,
    isAggregatesFetching,
    grouping,
    groupAggregateRows,
    isGroupAggregatesFetching,
  };
}
