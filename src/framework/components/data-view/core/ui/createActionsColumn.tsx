import { Button } from "@/framework/components/ui/button"
import type { ColumnDef, Row } from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { RowAction } from "../types"
import { ColumnManagerButton } from "./ColumnManagerButton"

interface ActionsColumnMeta<TData> {
  onOpen?: (rows: Row<TData>[]) => void
  onDelete?: (rows: Row<TData>[]) => void
  isDeleteEligible?: (row: Row<TData>) => boolean
  getRowUrl?: (row: Row<TData>) => string
  actions?: () => RowAction<TData>[]
}

export function createActionsColumn<TData>(
  meta: ActionsColumnMeta<TData> = {}
): ColumnDef<TData> {
  return {
    id: "columns",
    header: () => <ColumnManagerButton type="table" />,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        className="w-fit"
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          meta.onOpen?.([row])
        }}
        aria-label="Open row"
      >
        <ChevronRightIcon />
      </Button>
    ),
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
    meta: {
      className: "p-0",
      ...meta,
    },
  }
}

interface SelectColumnMeta<TData> {
  onSelect?: (rows: Row<TData>[]) => void
}

export function createSelectColumn<TData>(
  meta: SelectColumnMeta<TData> = {}
): ColumnDef<TData> {
  return {
    id: "select",
    header: () => <ColumnManagerButton type="table" />,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        className="w-fit"
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          meta.onSelect?.([row])
        }}
        aria-label="Select row"
      >
        <ChevronLeftIcon />
      </Button>
    ),
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
    meta: {
      className: "p-0",
      ...meta,
    },
  }
}
