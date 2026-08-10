import { Button } from "@/components/ui/button"
import type { ColumnDef, Row } from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { RowAction } from "../types"
import { ColumnManagerButton } from "./ColumnManagerButton"

interface ActionsColumnMeta<TData> {
  onOpen?: (rows: Row<TData>[]) => void
  onDelete?: (rows: Row<TData>[]) => void
  isDeleteEligible?: (row: Row<TData>) => boolean
  getRowUrl?: (row: Row<TData>) => string
  actions?: () => RowAction<TData>[]
}

function OpenRowButton<TData>({
  row,
  onOpen,
}: {
  row: Row<TData>
  onOpen?: (rows: Row<TData>[]) => void
}) {
  const t = useTranslations("DataView")
  return (
    <Button
      variant="ghost"
      className="w-fit"
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen?.([row])
      }}
      aria-label={t("openRow")}
    >
      <ChevronRightIcon />
    </Button>
  )
}

export function createActionsColumn<TData>(
  meta: ActionsColumnMeta<TData> = {}
): ColumnDef<TData> {
  return {
    id: "columns",
    header: () => <ColumnManagerButton type="table" />,
    cell: ({ row }) => <OpenRowButton row={row} onOpen={meta.onOpen} />,
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

function SelectRowButton<TData>({
  row,
  onSelect,
}: {
  row: Row<TData>
  onSelect?: (rows: Row<TData>[]) => void
}) {
  const t = useTranslations("DataView")
  return (
    <Button
      variant="ghost"
      className="w-fit"
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.([row])
      }}
      aria-label={t("selectRow")}
    >
      <ChevronLeftIcon />
    </Button>
  )
}

export function createSelectColumn<TData>(
  meta: SelectColumnMeta<TData> = {}
): ColumnDef<TData> {
  return {
    id: "select",
    header: () => <ColumnManagerButton type="table" />,
    cell: ({ row }) => <SelectRowButton row={row} onSelect={meta.onSelect} />,
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
