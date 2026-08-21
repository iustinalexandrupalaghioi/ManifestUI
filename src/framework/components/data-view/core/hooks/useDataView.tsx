"use client";

import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { deleteEditingStore } from "../../features/editing/editing.store";
import { deleteFilteringStores } from "../../features/filtering/filtering.store";
import type { FilterInput } from "../../features/filtering/filters";
import { useCellContextMenuFilter } from "../../features/filtering/useFiltering";
import {
  deleteSelectionStore,
  getSelectionStore,
} from "../../features/selection/selection.store";
import { deleteSortingStores } from "../../features/sorting/sorting.store";
import { deleteAggregatesStores } from "../../features/aggregates/aggregates.store";
import type { AggregateResult } from "../../features/aggregates/aggregates";
import { buildDefaultAggregateRules } from "../../features/aggregates/useAggregatableColumns";
import {
  deleteGroupingStores,
  getGroupingStore,
} from "../../features/grouping/grouping.store";
import { buildDefaultGrouping } from "../../features/grouping/useGroupableColumns";
import { countLeafRows } from "../../features/grouping/grouping";
import { GroupValueDisplay } from "../../features/grouping/ui/GroupValueDisplay";
import type {
  GroupAggregateRow,
  GroupByRule,
} from "../../features/grouping/grouping";
import { getViewsStore } from "../../features/views/views.store";
import type { DataViewFeature, DataViewFeatureContext } from "../contracts";
import {
  deleteCoreStore,
  getCoreStore,
  useCoreStore,
} from "../stores/DataViewStore";
import { deleteViewModeStore, getViewModeStore } from "../stores/ViewModeStore";
import "../tanstack-augmentations";
import { useAvailableHeight } from "./useAvailableHeight";
import { useColumnHandlers } from "./useColumnHandler";
import { useColumnState } from "./useColumnState";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useScrollFreeze } from "./useScrollFreeze";
import { ChevronDown, ChevronRight } from "lucide-react";

function sameSelection(a: Record<string, boolean>, b: Record<string, boolean>) {
  const aKeys = Object.keys(a)
    .filter((k) => a[k])
    .sort();
  const bKeys = Object.keys(b)
    .filter((k) => b[k])
    .sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k, i) => k === bKeys[i]);
}

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
  preFilters?: FilterInput[];
  initialListColumnVisibility?: VisibilityState;
  tableMeta?: import("@tanstack/react-table").TableMeta<TData>;
  activeRowId?: string;
  openOnRowClick?: boolean;
  aggregateValues?: AggregateResult;
  isAggregatesFetching?: boolean;
  groupAggregateRows?: GroupAggregateRow[];
  isGroupAggregatesFetching?: boolean;
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
  } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<import("@tanstack/react-table").Table<TData>>(null!);
  const staticColumnIds = useRef<Set<string>>(new Set());

  // ── Initialise stores ────────────────────────────────────────────────────
  getViewsStore(
    tableId,
    defaultViewName,
    initialColumnVisibility,
    initialListColumnVisibility ?? {},
    buildDefaultAggregateRules(columns),
    buildDefaultGrouping(columns),
  );

  const selectionStore = getSelectionStore(tableId);
  const storedSelection = selectionStore((s) => s.rowSelection);
  const lastSyncRef = useRef<"toStore" | "toLocal" | null>(null);

  useEffect(() => {
    if (lastSyncRef.current === "toLocal") {
      lastSyncRef.current = null;
      return;
    }
    if (!sameSelection(rowSelection, storedSelection)) {
      lastSyncRef.current = "toStore";
      selectionStore.getState().setRowSelection(rowSelection);
    }
  }, [rowSelection]);

  useEffect(() => {
    if (lastSyncRef.current === "toStore") {
      lastSyncRef.current = null;
      return;
    }
    if (!sameSelection(storedSelection, rowSelection)) {
      lastSyncRef.current = "toLocal";
      setRowSelection(storedSelection);
    }
  }, [storedSelection]);

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
    () => grouping.map((g) => g.columnId),
    [grouping],
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
  const onGroupingChange = (
    updater: string[] | ((old: string[]) => string[]),
  ) => {
    const nextIds =
      typeof updater === "function" ? updater(groupingIds) : updater;
    const byId = new Map(grouping.map((g) => [g.columnId, g]));
    const next: GroupByRule[] = nextIds.map((id) => {
      const existing = byId.get(id);
      if (existing) return existing;
      const meta = tableRef.current?.getColumn(id)?.columnDef.meta;
      return {
        columnId: id,
        columnName: meta?.columnName ?? id,
        columnLabel: meta?.columnLabel ?? id,
        columnType: meta?.columnType ?? "text",
        ...(meta?.origin ? { origin: meta.origin } : {}),
      };
    });
    const mode = getViewModeStore(tableId).getState().activeMode;
    if (mode === "list") {
      getGroupingStore(tableId, listViewId).getState().setGrouping(next);
      getViewsStore(tableId).getState().updateListDraft({ grouping: next });
    } else {
      getGroupingStore(tableId, tableViewId).getState().setGrouping(next);
      getViewsStore(tableId).getState().updateTableDraft({ grouping: next });
    }
  };

  // ── Group column ─────────────────────────────────────────────────────────
  const tGrouping = useTranslations("Grouping");
  const groupColumn: ColumnDef<TData> = useMemo(
    () => ({
      id: "group",
      header: () => tGrouping("group"),
      cell: ({ row }) => {
        if (!row.getIsGrouped()) return null;
        const meta = tableRef.current?.getColumn(row.groupingColumnId!)
          ?.columnDef.meta;
        return (
          <button
            type="button"
            className="flex h-full w-full items-center gap-1.5 text-left"
            style={{ paddingLeft: `${row.depth * 20}px` }}
            onClick={row.getToggleExpandedHandler()}
          >
            <span className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground">
              {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {meta?.columnLabel ?? row.groupingColumnId}:{" "}
            </span>
            <span className="truncate font-semibold">
              <GroupValueDisplay
                value={row.getValue(row.groupingColumnId!)}
                type={meta?.columnType ?? "text"}
                options={meta?.selectOptions}
                bucket={meta?.bucket}
              />
            </span>
            <span className="shrink-0 text-muted-foreground">
              ({countLeafRows(row)})
            </span>
          </button>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: true,
      enableHiding: false,
      enableGrouping: false,
      size: 220,
      minSize: 140,
    }),
    [tGrouping],
  );

  const tableColumns = useMemo(
    () => [groupColumn, ...columns],
    [groupColumn, columns],
  );

  // ── TanStack table ───────────────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns: tableColumns,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    defaultColumn: { enableResizing: true },
    manualPagination: true,
    groupedColumnMode: false,
    enableRowSelection: (row) => !row.getIsGrouped(),
    getRowId: getRowId ?? ((_, index) => String(index)),
    state: {
      rowSelection,
      grouping: groupingIds,
      columnVisibility: {
        ...columnVisibility,
        group: groupingIds.length > 0,
      },
      columnSizing,
      columnPinning: {
        left: [
          "group",
          "select",
          "columns",
          ...columnPinning.left.filter(
            (id) => !["group", "select", "columns"].includes(id),
          ),
        ],
      },
      columnOrder:
        columnOrder.length > 0
          ? [
              "group",
              "select",
              "columns",
              ...columnOrder.filter(
                (id) => !["group", "select", "columns"].includes(id),
              ),
            ]
          : undefined,
      sorting,
      globalFilter,
    },
    onRowSelectionChange: setRowSelection,
    onGroupingChange,
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
  const rafRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const colSizes: Record<string, number> = {};
      for (const header of table.getFlatHeaders()) {
        colSizes[`--header-${header.id}-size`] = header.getSize();
        colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
      }
      getCoreStore(tableId).getState().setColumnSizeVars(colSizes);
    });
  }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

  // ── Layout ───────────────────────────────────────────────────────────────
  const autoHeight = useAvailableHeight(
    fixedHeight !== undefined ? { current: null } : scrollContainerRef,
  );
  const height = fixedHeight ?? autoHeight;
  const isResizing = !!table.getState().columnSizingInfo.isResizingColumn;
  const handleScroll = useScrollFreeze(scrollContainerRef, isResizing);

  useEffect(() => {
    getCoreStore(tableId).getState().setIsResizing(isResizing);
  }, [tableId, isResizing]);

  // ── Feature registry loop ────────────────────────────────────────────────
  const prevFeaturesLengthRef = useRef(features.length);
  if (process.env.NODE_ENV !== "production") {
    if (prevFeaturesLengthRef.current !== features.length) {
      throw new Error(
        "DataView: the features array length changed between renders. " +
          "Define features as a module-level constant, not inline or in useMemo.",
      );
    }
  }
  prevFeaturesLengthRef.current = features.length;

  const featureContext: DataViewFeatureContext<TData> = useMemo(
    () => ({ tableId, getTable: () => table }),
    [tableId],
  );

  for (const feature of features) {
    feature.useFeature?.(featureContext);
  }

  // ── Infinite scroll ──────────────────────────────────────────────────────
  useInfiniteScroll(loadMoreRef, scrollContainerRef, {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: activeMode,
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      deleteCoreStore(tableId);
      deleteViewModeStore(tableId);
      deleteSelectionStore(tableId);
      deleteFilteringStores(tableId);
      deleteSortingStores(tableId);
      deleteAggregatesStores(tableId);
      deleteGroupingStores(tableId);
      deleteEditingStore(tableId);
    };
  }, [tableId]);

  // ── Contexts ──────────────────────────────────────────────────────────────
  const coreCtx = useMemo(
    () => ({
      table,
      tableId,
      scrollContainerRef,
      handleScroll,
      viewType: "table" as const,
      staticColumnIds,
    }),
    [table, tableId, handleScroll],
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
