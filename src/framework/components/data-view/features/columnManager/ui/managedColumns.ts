import type { Column, Table, VisibilityState } from "@tanstack/react-table";

/** Columns the user can't reorder, hide or pin (selection, the column menu, the buffer, the group column). */
export const SYSTEM_COLUMNS = new Set(["select", "columns", "_buffer", "group"]);

/** A column as the column manager edits it, before Apply. */
export interface ManagedColumn {
  id: string;
  name: string;
  visible: boolean;
  pinned: boolean;
}

function configurableColumns<TData>(table: Table<TData>) {
  const allCols = table.getAllLeafColumns().filter((c) => !SYSTEM_COLUMNS.has(c.id));
  return { allCols, colMap: new Map<string, Column<TData>>(allCols.map((c) => [c.id, c])) };
}

const nameOf = <TData>(col: Column<TData>) => col.columnDef.meta?.columnLabel ?? col.id;

/** The grid's columns in their current order, with visibility and pinning. */
export function buildManagedColumns<TData>(table: Table<TData>, columnOrder: string[], pinnedLeft: string[]): ManagedColumn[] {
  const { allCols, colMap } = configurableColumns(table);
  const orderedIds = columnOrder.length > 0 ? columnOrder.filter((id) => colMap.has(id)) : allCols.map((c) => c.id);
  for (const col of allCols) {
    if (!orderedIds.includes(col.id)) orderedIds.push(col.id);
  }
  const pinnedSet = new Set(pinnedLeft);
  return orderedIds.map((id) => {
    const col = colMap.get(id)!;
    return { id, name: nameOf(col), visible: col.getIsVisible(), pinned: pinnedSet.has(id) };
  });
}

/** The cards' fields in their current order, with visibility (cards don't pin). */
export function buildListManagedColumns<TData>(
  table: Table<TData>,
  listColumnVisibility: VisibilityState,
  listColumnOrder: string[],
): ManagedColumn[] {
  const { allCols, colMap } = configurableColumns(table);
  const orderedIds =
    listColumnOrder.length > 0
      ? [
          ...listColumnOrder.filter((id) => colMap.has(id)),
          ...allCols.filter((c) => !listColumnOrder.includes(c.id)).map((c) => c.id),
        ]
      : allCols.map((c) => c.id);
  return orderedIds.map((id) => ({
    id,
    name: nameOf(colMap.get(id)!),
    visible: listColumnVisibility[id] !== false,
    pinned: false,
  }));
}

/** What applying the edited grid columns sets: pinned columns first, then the rest, and their visibility. */
export function tableColumnsToApply(cols: ManagedColumn[], currentVisibility: VisibilityState) {
  const pinned = cols.filter((c) => c.pinned).map((c) => c.id);
  const unpinned = cols.filter((c) => !c.pinned).map((c) => c.id);
  const visibility: Record<string, boolean> = { ...currentVisibility };
  for (const col of cols) visibility[col.id] = col.visible;
  return { order: [...pinned, ...unpinned], pinning: { left: pinned }, visibility };
}

/** Every configurable grid column visible again (the reset). */
export function allColumnsVisible<TData>(table: Table<TData>): Record<string, boolean> {
  return Object.fromEntries(configurableColumns(table).allCols.map((c) => [c.id, true]));
}
