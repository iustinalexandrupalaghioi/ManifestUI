import type { Enum } from "@/framework/types/global/Enum";
import type { Row, RowData } from "@tanstack/react-table";
import type { ColumnType } from "../features/filtering/filters";
import type { FieldConfig, PickupFillField } from "../../form/types/types";

export type EditableFieldMeta =
  | { kind: "direct"; field: FieldConfig<any> }
  | {
      kind: "pickup";
      owningField: FieldConfig<any>;
      fillField: PickupFillField;
    };

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    columnId?: string;
    columnName?: string;
    editingField?: string;
    columnLabel?: string;
    origin?: string;
    columnType?: ColumnType | null;
    aggregatable?: boolean;
    defaultAggregate?: import("../features/aggregates/aggregates").AggregateFunction | null;
    // Row grouping (grouping.ts) — distinct from group/groupLabel below,
    // which are unrelated column-header section labels.
    groupable?: boolean;
    defaultGroupBy?: number | null;
    selectOptions?: Enum[];
    // Storage bucket for file-type columns — needed to reuse CellValueDisplay
    // (the same renderer TableCellContent uses) outside a real cell, e.g. a
    // grouped row's label.
    bucket?: string;
    onSelect?: (rows: Row<TData>[]) => void;
    group?: string;
    groupLabel?: string;
    inlineLabel?: string;
    labelPosition?: "before" | "after";
    editableField?: EditableFieldMeta;
  }

  interface ColumnSort {
    columnName?: string;
    origin?: string;
  }

  interface TableMeta<TData extends RowData> {
    updateManyAsync?: (
      items: { id: string | number; data: Record<string, unknown> }[],
    ) => Promise<import("../../../lib/actionResult").BulkActionResult>;
    getRecordId?: (original: TData) => string | number;
    useDetailForm?: (item: TData) => {
      form: import("react-hook-form").UseFormReturn<any>;
      isDirty: boolean;
      canSave: boolean;
    };
  }
}

export interface SortRule {
  id: string;
  desc: boolean;
  columnName?: string;
  origin?: string;
}
