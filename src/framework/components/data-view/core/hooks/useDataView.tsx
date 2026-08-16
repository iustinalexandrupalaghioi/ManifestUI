"use client";

import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { deleteEditingStore } from "../../features/editing/editing.store";
import { deleteFilteringStores } from "../../features/filtering/filtering.store";
import type { FilterInput } from "../../features/filtering/filters";
import { useCellContextMenuFilter } from "../../features/filtering/useFiltering";
import {
  deleteSelectionStore,
  getSelectionStore,
} from "../../features/selection/selection.store";
import { deleteSortingStores } from "../../features/sorting/sorting.store";
import { getViewsStore } from "../../features/views/views.store";
import type { DataViewFeature, DataViewFeatureContext } from "../contracts";
import {
  deleteCoreStore,
  getCoreStore,
  useCoreStore,
} from "../stores/DataViewStore";
import { deleteViewModeStore } from "../stores/ViewModeStore";
import "../tanstack-augmentations";
import { useAvailableHeight } from "./useAvailableHeight";
import { useColumnHandlers } from "./useColumnHandler";
import { useColumnState } from "./useColumnState";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useScrollFreeze } from "./useScrollFreeze";

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
  );

  // ── Row selection sync — prop ↔ SelectionStore ──────────────────────────
  const selectionStore = getSelectionStore(tableId);
  const storedSelection = selectionStore((s) => s.rowSelection);

  useEffect(() => {
    if (JSON.stringify(rowSelection) !== JSON.stringify(storedSelection)) {
      selectionStore.getState().setRowSelection(rowSelection);
    }
  }, [rowSelection]);

  useEffect(() => {
    if (JSON.stringify(storedSelection) !== JSON.stringify(rowSelection)) {
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
    tableViewId,
    listViewId,
    activeMode,
  } = useColumnState(tableId, initialColumnVisibility);

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

  // ── TanStack table ───────────────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    defaultColumn: { enableResizing: true },
    manualPagination: true,
    getRowId: getRowId ?? ((_, index) => String(index)),
    state: {
      rowSelection,
      columnVisibility,
      columnSizing,
      columnPinning: {
        left: [
          "select",
          "columns",
          ...columnPinning.left.filter(
            (id) => id !== "select" && id !== "columns",
          ),
        ],
      },
      columnOrder:
        columnOrder.length > 0
          ? [
              "select",
              "columns",
              ...columnOrder.filter(
                (id) => id !== "select" && id !== "columns",
              ),
            ]
          : undefined,
      sorting,
      globalFilter,
    },
    onRowSelectionChange: setRowSelection,
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
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      deleteCoreStore(tableId);
      deleteViewModeStore(tableId);
      deleteSelectionStore(tableId);
      deleteFilteringStores(tableId);
      deleteSortingStores(tableId);
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
  };
}
