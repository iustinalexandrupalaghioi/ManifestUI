import type { ColumnDef } from "@tanstack/react-table";
import type { FilterOperator, FilterRule } from "../filtering/filters";
import type { ListViewRecord, TableViewRecord } from "./views.types";

export interface DataViewDefaultSort {
  column: string;
  desc?: boolean;
}

export interface DataViewDefaultFilter {
  column: string;
  operator: FilterOperator;
  value?: FilterRule["value"];
}

interface DataViewModeDefaults {
  sorting?: DataViewDefaultSort[];
  filters?: DataViewDefaultFilter[];
  /** Column ids in display order; unlisted columns follow in config order. */
  columnOrder?: string[];
}

/** Initial state of the built-in default view. Views users save keep their own state. */
export interface DataViewDefaults {
  table?: DataViewModeDefaults & {
    /** Widths in px by column id; overrides `ColumnConfig.size`. */
    columnSizing?: Record<string, number>;
    pinned?: string[];
  };
  list?: DataViewModeDefaults;
}

export interface ResolvedViewDefaults {
  table?: Partial<
    Pick<TableViewRecord, "sorting" | "filters" | "columnSizing" | "columnOrder" | "columnPinning">
  >;
  list?: Partial<Pick<ListViewRecord, "sorting" | "filters" | "listColumnOrder">>;
}

function resolveFilters(filters: DataViewDefaultFilter[] | undefined, columns: ColumnDef<any, any>[]) {
  if (!filters?.length) return undefined;
  return filters.flatMap<FilterRule>((filter) => {
    const column = columns.find((candidate) => candidate.id === filter.column);
    const meta = column?.meta;
    if (!column || !meta) return [];
    return [
      {
        columnId: filter.column,
        columnName: meta.columnName ?? filter.column,
        columnLabel: meta.columnLabel ?? filter.column,
        columnType: (meta.columnType ?? "text") as FilterRule["columnType"],
        operator: filter.operator,
        value: filter.value ?? null,
        origin: meta.origin,
        selectOptions: meta.selectOptions,
      },
    ];
  });
}

const resolveSorting = (sorting: DataViewDefaultSort[] | undefined) =>
  sorting?.length ? sorting.map((rule) => ({ id: rule.column, desc: !!rule.desc })) : undefined;

/** Turns config defaults into view-store state; filters need column meta for labels and types. */
export function resolveViewDefaults(
  defaults: DataViewDefaults | undefined,
  columns: ColumnDef<any, any>[],
): ResolvedViewDefaults | undefined {
  if (!defaults) return undefined;
  const { table, list } = defaults;
  return {
    table: table && {
      sorting: resolveSorting(table.sorting),
      filters: resolveFilters(table.filters, columns),
      columnSizing: table.columnSizing,
      columnOrder: table.columnOrder,
      columnPinning: table.pinned?.length ? { left: table.pinned } : undefined,
    },
    list: list && {
      sorting: resolveSorting(list.sorting),
      filters: resolveFilters(list.filters, columns),
      listColumnOrder: list.columnOrder,
    },
  };
}
