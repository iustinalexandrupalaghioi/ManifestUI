"use client"

import type { Table, Cell, Row } from "@tanstack/react-table"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import type { ContextMenuState, ResolvedAction } from "../../core/types"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildLabel(
  label: ReactNode,
  eligible: number,
  total: number,
  isMulti: boolean
): ReactNode {
  if (!isMulti) return label
  return [label, ` (${eligible}/${total})`]
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useContextMenu<TData>(table: Table<TData>) {
  const tc = useTranslations("Common")
  const [contextMenu, setContextMenu] =
    useState<ContextMenuState<TData> | null>(null)

  const tableRef = useRef(table)
  useEffect(() => {
    tableRef.current = table
  }, [table])

  const handleCellContextMenu = useCallback(
    (
      e: React.MouseEvent,
      cell: Cell<TData, unknown>,
      effectiveRows: Row<TData>[]
    ) => {
      e.preventDefault()

      const clickedRow = cell.row
      const cellMeta = cell.column.columnDef.meta
      const value = cell.getValue()

      // ── Actions meta — always from the "columns" column ────────────────
      // onDelete, onOpen, getRowUrl, actions are defined on the actions
      // column (id: "columns"), not on individual data columns.
      const actionsMeta =
        clickedRow.getAllCells().find((c) => c.column.id === "columns")?.column
          .columnDef.meta ?? cellMeta

      const isMulti = effectiveRows.length > 1
      const total = effectiveRows.length

      // ── Copy link URL ──────────────────────────────────────────────────
      const copyUrl = actionsMeta?.getRowUrl?.(clickedRow) ?? null

      // ── Delete ─────────────────────────────────────────────────────────
      let deleteAction: ResolvedAction | null = null
      if (actionsMeta?.onDelete) {
        const eligibleRows = actionsMeta.isDeleteEligible
          ? effectiveRows.filter(actionsMeta.isDeleteEligible)
          : effectiveRows
        const eligible = eligibleRows.length
        deleteAction = {
          label: buildLabel(tc("delete"), eligible, total, isMulti),
          onSelect: () => actionsMeta.onDelete!(eligibleRows),
          destructive: true,
          disabled: eligible === 0,
        }
      }

      // ── Submenu actions ────────────────────────────────────────────────
      const rawActions = actionsMeta?.actions?.() ?? []
      const resolvedActions: ResolvedAction[] = rawActions.map((action) => {
        const eligibleRows = action.isEligible
          ? effectiveRows.filter(action.isEligible)
          : effectiveRows
        const eligible = eligibleRows.length
        return {
          label: buildLabel(action.label, eligible, total, isMulti),
          onSelect: () => action.onSelect(eligibleRows),
          destructive: action.destructive,
          disabled: eligible === 0,
        }
      })

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        copyValue: value,
        copyUrl,
        effectiveRows,
        isMulti,
        // Open disabled for multi-selection
        onOpen: actionsMeta?.onOpen,
        deleteAction,
        actions: resolvedActions,
        // ── Column info for filter actions — from the clicked cell ────────
        columnId: cell.column.id,
        columnType: cellMeta?.columnType ?? null,
        columnName: cellMeta?.columnName ?? cell.column.id,
        columnLabel: cellMeta?.columnLabel ?? cell.column.id,
        selectOptions: cellMeta?.selectOptions,
        origin: cellMeta?.origin,
        canFilter: cell.column.getCanFilter(),
      })
    },
    [tc]
  )

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  return { contextMenu, handleCellContextMenu, closeContextMenu }
}
