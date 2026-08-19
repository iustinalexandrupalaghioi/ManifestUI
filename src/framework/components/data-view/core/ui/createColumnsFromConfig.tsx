import TableCellContent from "@/framework/components/data-view/core/ui/TableCellContent";
import type { ColumnType } from "@/framework/components/data-view/features/filtering/filters";
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
  selectOptions?: EnumOptions;
  bucket?: string;
  origin?: string;
  group?: string;
  groupLabel?: TranslatableText;
  inlineLabel?: TranslatableText;
  labelPosition?: "before" | "after";
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
        origin: col.origin,
        selectOptions,
        group: col.group,
        groupLabel: col.groupLabel
          ? resolveLabel(col.groupLabel, locale)
          : undefined,
        inlineLabel: col.inlineLabel
          ? resolveLabel(col.inlineLabel, locale)
          : undefined,
        labelPosition: col.labelPosition,
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
