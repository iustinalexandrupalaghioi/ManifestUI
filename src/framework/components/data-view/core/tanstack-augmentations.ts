import type { Enum } from "@/framework/types/global/Enum"
import type { Row, RowData } from "@tanstack/react-table"
import type { ColumnType } from "../features/filtering/filters"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
    columnId?: string
    columnName?: string
    columnLabel?: string
    origin?: string
    columnType?: ColumnType | null
    selectOptions?: Enum[]
    onSelect?: (rows: Row<TData>[]) => void
    group?: string
    groupLabel?: string
    inlineLabel?: string
    labelPosition?: "before" | "after"
  }

  interface ColumnSort {
    columnName?: string
    origin?: string
  }
}

export interface SortRule {
  id: string
  desc: boolean
  columnName?: string
  origin?: string
}
