import type { Row, Table } from "@tanstack/react-table"
import type { ReactNode } from "react"
import { useEffect, useMemo, useRef } from "react"
import { useTranslations } from "next-intl"

export interface DataTableToolbarAction {
  label: ReactNode
  onSelect: (rows: Row<any>[]) => void
  destructive?: boolean
  disabled?: boolean
}

export function useDataTableToolbarActions<TData>(
  table: Table<TData>,
  selectedRows: Row<TData>[]
) {
  const tc = useTranslations("Common")
  const tableRef = useRef(table)
  useEffect(() => {
    tableRef.current = table
  }, [table])

  const resolvedActions = useMemo(() => {
    const t = tableRef.current
    const allColumns = t.getAllColumns()

    // Collect actions from all column meta (deduplicated by label string)
    const seen = new Set<string>()
    const actions: DataTableToolbarAction[] = []

    for (const column of allColumns) {
      const meta = column.columnDef.meta
      if (!meta) continue

      // Delete action
      if (meta.onDelete) {
        const key = "delete"
        if (!seen.has(key)) {
          seen.add(key)
          const eligible = meta.isDeleteEligible
            ? selectedRows.filter(meta.isDeleteEligible)
            : selectedRows
          actions.push({
            label: tc("delete"),
            onSelect: () => meta.onDelete!(eligible),
            destructive: true,
            disabled: eligible.length === 0,
          })
        }
      }

      // Custom actions
      const rawActions = meta.actions?.() ?? []
      for (const action of rawActions) {
        const key = String(action.label)
        if (seen.has(key)) continue
        seen.add(key)
        const eligible = action.isEligible
          ? selectedRows.filter(action.isEligible)
          : selectedRows
        actions.push({
          label: action.label,
          onSelect: () => action.onSelect(eligible),
          destructive: action.destructive,
          disabled: eligible.length === 0,
        })
      }
    }

    return actions
  }, [selectedRows, tc])

  return { resolvedActions }
}
