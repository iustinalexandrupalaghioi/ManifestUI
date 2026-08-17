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
  /** Split view: a plain click on a row/card opens its detail directly
   *  instead of just selecting it. */
  openOnRowClick?: boolean;
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
  // These two effects mirror each other's target, so a naive bidirectional
  // sync would ping-pong forever: whichever commit finds `rowSelection` and
  // `storedSelection` disagreeing runs BOTH effects in the same pass, each
  // closing over the pre-update snapshot of the other, so each "corrects"
  // the mismatch by overwriting the other's just-applied value — swapping
  // the two back and forth every commit. `lastSyncRef` records which side
  // initiated the most recent push so the effect on the *receiving* side
  // can recognize an update it caused and skip reacting to it.
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
