import type { Cell, Row, Table } from "@tanstack/react-table";
import type { ReactNode, RefObject } from "react";
import type { Enum } from "@/framework/types/global/Enum";
import type { ColumnType } from "../features/filtering/filters";
import type { AggregateRule } from "../features/aggregates/aggregates";
import type { GroupAggregateRow, GroupByRule } from "../features/grouping/grouping";

export interface RowAction<TData> {
  label: ReactNode;
  isEligible?: (row: Row<TData>) => boolean;
  onSelect: (eligibleRows: Row<TData>[]) => void | Promise<void>;
  destructive?: boolean;
}

export interface ResolvedAction {
  label: ReactNode;
  onSelect: () => void | Promise<void>;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ContextMenuState<TData> {
  x: number;
  y: number;
  copyValue: unknown;
  copyUrl: string | null;
  effectiveRows: Row<TData>[];
  isMulti: boolean;
  onOpen?: (rows: Row<TData>[]) => void;
  deleteAction: ResolvedAction | null;
  actions: ResolvedAction[];
  columnId: string;
  columnType: ColumnType | null;
  columnName: string;
  columnLabel: string;
  selectOptions?: Enum[];
  origin?: string;
  canFilter?: boolean;
  /** The right-clicked row's id — the specific cell to start editing, if Edit is selected. */
  rowId: string;
}

export interface VirtualDataTableBodyProps<TData> {
  rows: Row<TData>[];
  table: Table<TData>;
  lastColumnId: string | undefined;
  columnsLength: number;
  grouping: GroupByRule[];
  groupAggregateRules: AggregateRule[];
  groupAggregateLookup: Map<string, GroupAggregateRow>;
  isGroupAggregatesFetching?: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isResizing: boolean;
  onCellContextMenu: (
    e: React.MouseEvent,
    cell: Cell<TData, unknown>,
    effectiveRows: Row<TData>[],
  ) => void;
  rowSelection: Record<string, boolean>;
  activeRowId?: string;
  onRowClick?: (e: React.MouseEvent, row: Row<TData>) => void;
  onRowDoubleClick?: (row: Row<TData>) => void;
  onCellDoubleClick?: (cell: Cell<TData, unknown>) => boolean;
  selectedCellValuesRef: RefObject<() => string>;
  onRowContextClick: (row: Row<TData>) => void;
  isLoading: boolean;
  isCellSelected: (rowId: string, columnId: string) => boolean;
  isCellEditing: (rowId: string, columnId: string) => boolean;
  editingKey: string | null;
  onCellClick: (e: React.MouseEvent, cell: Cell<TData, unknown>) => void;
  onCellContextClick: (cell: Cell<TData, unknown>) => void;
  columnStateKey: string;
}
