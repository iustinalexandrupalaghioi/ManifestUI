import TableCellContent from "@/framework/components/data-view/core/ui/TableCellContent";
import type { ColumnType } from "@/framework/components/data-view/features/filtering/filters";
import type { AggregateFunction } from "@/framework/components/data-view/features/aggregates/aggregates";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { TranslatableText } from "@/framework/types/i18n-types";
import {
  resolveLabel,
  resolveOptions,
  type EnumOptions,
} from "@/framework/lib/resolveLabel";

export interface ColumnConfig {
  field: string;
  label: TranslatableText;
  columnLabel?: TranslatableText;
  columnName?: string;
  // Form field this column's inline editing should target, when it isn't
  // columnName — e.g. an accessorFn display column derived from a raw id.
  editingField?: string;
  accessorFn?: (row: any, locale: string) => any;
  type: ColumnType;
  size?: number;
  minSize?: number;
  hidden?: boolean;
  navigationHidden?: boolean;
  pickupHidden?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  aggregatable?: boolean;
  defaultAggregate?: AggregateFunction;
  groupable?: boolean;
  defaultGroupBy?: number;
  selectOptions?: EnumOptions;
  bucket?: string;
  origin?: string;
  group?: string;
  groupLabel?: TranslatableText;
  /** Card-only text shown before / after the value, e.g. "$" or "cm". */
  prefix?: TranslatableText;
  suffix?: TranslatableText;
}

const DEFAULT_SIZE_BY_TYPE: Record<ColumnType, number> = {
  text: 200,
  number: 80,
  boolean: 90,
  datetime: 140,
  date: 120,
  time: 100,
  select: 120,
  file: 120,
  json: 120,
};

export function createColumnsFromConfig<TItem>(
  columns: ColumnConfig[],
  locale: string,
): ColumnDef<TItem>[] {
  return columns.map((col) => {
    const selectOptions = resolveOptions(col.selectOptions, locale);
    return {
      id: col.field,
      ...(col.accessorFn
        ? { accessorFn: (row: TItem) => col.accessorFn!(row, locale) }
        : { accessorKey: col.field }),
      header: undefined,
      size: col.size ?? DEFAULT_SIZE_BY_TYPE[col.type],
      minSize: col.minSize ?? 30,
      enableSorting: col.sortable ?? true,
      enableColumnFilter: col.filterable ?? true,
      cell: TableCellContent(col.type, selectOptions, col.bucket),
      meta: {
        columnId: col.field,
        columnName: col.columnName ?? col.field,
        // Omitted (not set to undefined) when absent: table/list columns
        // for the same field get merged with `{...tableMeta, ...listMeta}`
        // (see define-resource-components.tsx), and an explicit `undefined`
        // here would win that spread and blank out the table side's value.
        ...(col.editingField ? { editingField: col.editingField } : {}),
        columnLabel: resolveLabel(col.columnLabel ?? col.label, locale),
        columnType: col.type,
        aggregatable: col.aggregatable,
        defaultAggregate: col.defaultAggregate,
        groupable: col.groupable,
        defaultGroupBy: col.defaultGroupBy,
        origin: col.origin,
        selectOptions,
        bucket: col.bucket,
        group: col.group,
        groupLabel: col.groupLabel
          ? resolveLabel(col.groupLabel, locale)
          : undefined,
        prefix: col.prefix ? resolveLabel(col.prefix, locale) : undefined,
        suffix: col.suffix ? resolveLabel(col.suffix, locale) : undefined,
      },
    };
  });
}

export function createVisibilityFromConfig(
  columns: ColumnConfig[],
  mode: "default" | "navigation" | "pickup" = "default",
): VisibilityState {
  return Object.fromEntries(
    columns.map((col) => {
      let hidden: boolean;
      switch (mode) {
        case "navigation":
          hidden = col.navigationHidden ?? col.hidden ?? false;
          break;
        case "pickup":
          hidden = col.pickupHidden ?? col.hidden ?? false;
          break;
        default:
          hidden = col.hidden ?? false;
      }
      return [col.field, !hidden];
    }),
  );
}

/** Table columns plus list-only columns; a column in both gets the list meta merged in. */
export function mergeColumnsById<T extends { id?: string; meta?: object }>(tableCols: T[], listCols: T[]): T[] {
  const listById = new Map(listCols.map((c) => [c.id, c]));
  const merged = tableCols.map((c) => {
    const listCol = c.id ? listById.get(c.id) : undefined;
    if (!listCol) return c;
    listById.delete(c.id);
    return { ...c, meta: { ...c.meta, ...listCol.meta } };
  });
  return [...merged, ...listById.values()];
}

/** Visibility for one mode's columns; columns only in the other mode start hidden. */
export function deriveColumnVisibility(
  own: ColumnConfig[] | null,
  other: ColumnConfig[] | null,
  mode: "default" | "navigation" | "pickup",
): VisibilityState | undefined {
  if (!own) return undefined;
  const visibility = createVisibilityFromConfig(own, mode);
  for (const col of other ?? []) {
    if (!(col.field in visibility)) visibility[col.field] = false;
  }
  return visibility;
}
