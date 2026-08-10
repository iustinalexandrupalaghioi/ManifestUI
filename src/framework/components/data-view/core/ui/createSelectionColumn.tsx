import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

// ─────────────────────────────────────────────
// createSelectionColumn
//
// Shared checkbox column used by every table.
// Always column [0] — before the actions column.
// ─────────────────────────────────────────────

function SelectAllCheckbox<TData>({ table }: { table: Table<TData> }) {
  const t = useTranslations("DataView");
  return (
    <Checkbox
      className="ms-1"
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label={t("selectAll")}
    />
  );
}

function SelectRowCheckbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const t = useTranslations("DataView");
  return (
    <div data-checkbox className="ms-1">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(!!value)}
        aria-label={t("selectRow")}
      />
    </div>
  );
}

export function createSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => (
      <SelectRowCheckbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(value)}
      />
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
