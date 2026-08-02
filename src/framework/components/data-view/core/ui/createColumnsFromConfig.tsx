import TableCellContent from "@/framework/components/data-view/core/ui/TableCellContent";
import type { ColumnType } from "@/framework/components/data-view/features/filtering/filters";
import type { Enum } from "@/framework/types/global/Enum";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";

export interface ColumnConfig {
  field: string;
  label: string;
  columnLabel?: string;
  columnName?: string;
  accessorFn?: (row: any) => any;
  type: ColumnType;
  size?: number;
  minSize?: number;
  hidden?: boolean;
  cardHidden?: boolean;
  cardNavigationHidden?: boolean;
  navigationHidden?: boolean;
  pickupHidden?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  selectOptions?: Enum[];
  bucket?: string;
  origin?: string;
  cardGroup?: string;
  cardGroupLabel?: string;
  cardLabel?: string;
  cardLabelPosition?: "before" | "after";
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
): ColumnDef<TItem>[] {
  return columns.map((col) => ({
    id: col.field,
    ...(col.accessorFn
      ? { accessorFn: col.accessorFn }
      : { accessorKey: col.field }),
    header: undefined,
    size: col.size ?? DEFAULT_SIZE_BY_TYPE[col.type],
    minSize: col.minSize ?? 30,
    enableSorting: col.sortable ?? true,
    enableColumnFilter: col.filterable ?? true,
    cell: TableCellContent(col.type, col.selectOptions, col.bucket),
    meta: {
      columnId: col.field,
      columnName: col.columnName ?? col.field,
      columnLabel: col.columnLabel ?? col.label,
      columnType: col.type,
      origin: col.origin,
      selectOptions: col.selectOptions,
      cardGroup: col.cardGroup,
      cardGroupLabel: col.cardGroupLabel,
      cardLabel: col.cardLabel,
      cardLabelPosition: col.cardLabelPosition,
    },
  }));
}

export function createVisibilityFromConfig(
  columns: ColumnConfig[],
  mode:
    | "default"
    | "card"
    | "navigation"
    | "card-navigation"
    | "pickup" = "default",
): VisibilityState {
  return Object.fromEntries(
    columns.map((col) => {
      let hidden: boolean;
      switch (mode) {
        case "card":
          hidden = col.cardHidden ?? col.hidden ?? false;
          break;
        case "navigation":
          hidden = col.navigationHidden ?? col.hidden ?? false;
          break;
        case "card-navigation":
          hidden =
            col.cardNavigationHidden ??
            col.navigationHidden ??
            col.cardHidden ??
            col.hidden ??
            false;
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
