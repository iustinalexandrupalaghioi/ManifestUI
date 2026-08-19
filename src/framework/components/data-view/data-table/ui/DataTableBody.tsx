"use client"

import type { Row, VisibilityState } from "@tanstack/react-table"
import { useEffect, useRef } from "react"
import { useDataViewCore } from "../../core/stores/DataViewProvider"
import { useDataViewLayout } from "../../core/stores/DataViewProvider"
import { useCellSelection } from "./useCellSelection"
import { useContextMenu } from "./useContextMenu"
import { useSelection } from "../../features/selection/useSelection"
import { useEditing } from "../../features/editing/useEditing"
import { getEditingStore } from "../../features/editing/editing.store"
import { CellContextMenu } from "../../core/ui/CellContextMenu"
import { VirtualDataTableBody } from "./VirtualDataTableBody"
import type { RowAction } from "../../core/types"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    className?: string
    onOpen?: (rows: Row<TData>[]) => void
    getRowUrl?: (row: Row<TData>) => string
    onDelete?: (rows: Row<TData>[]) => void
    isDeleteEligible?: (row: Row<TData>) => boolean
    actions?: () => RowAction<TData>[]
  }
}

interface DataViewBodyProps {
  rowSelection: Record<string, boolean>
  activeRowId?: string
  openOnRowClick?: boolean
  isLoading: boolean
  columnOrder: string[]
  columnPinning: { left: string[] }
  columnVisibility: VisibilityState
  columnSizing: Record<string, number>
}

export function DataTableBody({
  rowSelection,
  activeRowId,
  openOnRowClick,
  isLoading,
  columnOrder,
  columnPinning,
  columnVisibility,
  columnSizing,
}: DataViewBodyProps) {
  const { table, tableId, scrollContainerRef } = useDataViewCore()
  const { isResizing } = useDataViewLayout()

  const { handleRowClick, handleRowDoubleClick, handleRowContextClick } =
    useSelection(tableId, table, { openOnClick: openOnRowClick })

  const { contextMenu, handleCellContextMenu, closeContextMenu } =
    useContextMenu(table)

  const {
    isCellSelected,
    handleCellClick,
    handleCellContextClick,
    clearSelection,
    getSelectionTsv,
    selectedCell,
  } = useCellSelection(table, rowSelection)

  const { handleCellDoubleClick } = useEditing(tableId, table, selectedCell)

  const editingStore = getEditingStore(tableId)
  const editMode = editingStore((s) => s.editMode)
  const editingCell = editingStore((s) => s.editingCell)
  const isCellEditing = (rowId: string, columnId: string) =>
    editMode &&
    editingCell?.rowId === rowId &&
    editingCell?.columnId === columnId
  const editingKey =
    editMode && editingCell
      ? `${editingCell.rowId}:${editingCell.columnId}`
      : null

  const selectedCellValuesRef = useRef<() => string>(getSelectionTsv)
  useEffect(() => {
    selectedCellValuesRef.current = getSelectionTsv
  }, [getSelectionTsv])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (e.target === scrollContainerRef.current) clearSelection()
    }

    window.addEventListener("keydown", onKeyDown)
    scrollContainerRef.current?.addEventListener("pointerdown", onPointerDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      scrollContainerRef.current?.removeEventListener(
        "pointerdown",
        onPointerDown
      )
    }
  }, [clearSelection, scrollContainerRef])

  // Include sizing of pinned columns only — their getStart("left") offsets
  // change when any pinned column is resized, which the memo won't catch
  // without an explicit key change.
  const pinnedSizingKey = columnPinning.left
    .map((id) => columnSizing[id] ?? 0)
    .join(",")

  const columnStateKey = [
    columnOrder.join(","),
    columnPinning.left.join(","),
    JSON.stringify(columnVisibility),
    pinnedSizingKey,
  ].join("|")

  return (
    <>
      <VirtualDataTableBody
        isLoading={isLoading}
        selectedCellValuesRef={selectedCellValuesRef}
        rowSelection={rowSelection}
        activeRowId={activeRowId}
        rows={table.getRowModel().rows}
        lastColumnId={table.getAllLeafColumns().at(-1)?.id}
        columnsLength={table.getVisibleLeafColumns().length}
        scrollContainerRef={scrollContainerRef}
        isResizing={isResizing}
        onCellContextMenu={handleCellContextMenu}
        onRowContextClick={handleRowContextClick}
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowDoubleClick}
        onCellDoubleClick={handleCellDoubleClick}
        isCellSelected={isCellSelected}
        isCellEditing={isCellEditing}
        editingKey={editingKey}
        onCellClick={handleCellClick}
        onCellContextClick={handleCellContextClick}
        columnStateKey={columnStateKey}
      />
      <CellContextMenu
        selectedCellValuesRef={selectedCellValuesRef}
        state={contextMenu}
        onClose={closeContextMenu}
        allSelectedIds={Object.keys(table.getState().rowSelection)}
      />
    </>
  )
}
