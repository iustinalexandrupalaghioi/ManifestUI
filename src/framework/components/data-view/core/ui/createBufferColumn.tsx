import type { ColumnDef } from "@tanstack/react-table";

export function createBufferColumn<TData>(): ColumnDef<TData> {
  return {
    id: "_buffer",
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    size: 15,
  };
}
