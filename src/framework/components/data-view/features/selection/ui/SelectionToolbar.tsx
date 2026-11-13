import { getSelectionStore } from "../selection.store";

interface SelectionToolbarProps {
  tableId: string;
  totalCount: number;
}

/**
 * SelectionToolbar
 *
 * Displays the selected row count and total count. Rendered outside both
 * TableViewContent and ListViewContent because selection is shared across
 * modes — the count reflects the same state regardless of which view is active.
 *
 * Reads directly from SelectionStore so it only re-renders when the
 * selection count changes.
 */
export function SelectionToolbar({
  tableId,
  totalCount,
}: SelectionToolbarProps) {
  const selectionCount = getSelectionStore(tableId)(
    (s) => Object.keys(s.rowSelection).length,
  );

  return (
    <span className="py-1 me-2 text-sm whitespace-nowrap text-primary">
      {selectionCount} / {totalCount}
    </span>
  );
}
