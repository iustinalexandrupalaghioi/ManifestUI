import { Checkbox } from "@/framework/components/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";

// ─────────────────────────────────────────────
// createSelectionColumn
//
// Shared checkbox column used by every table.
// Always column [0] — before the actions column.
// ─────────────────────────────────────────────

export function createSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        className="ms-1"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div data-checkbox className="ms-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    size: 30,
    minSize: 30,
    maxSize: 30,
    meta: {
      className: "p-0",
    },
  };
}
