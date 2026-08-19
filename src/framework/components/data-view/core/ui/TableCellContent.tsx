import { formatByType } from "@/framework/lib/utils";
import { cn } from "@/framework/lib/utils";
import type { Enum } from "@/framework/types/global/Enum";
import type { CellContext } from "@tanstack/react-table";
import type { ColumnType } from "../../features/filtering/filters";
import { getEditingStore } from "../../features/editing/editing.store";
import { EditableCell } from "../../features/editing/ui/EditableCell";
import { useDataViewCore } from "../stores/DataViewProvider";
import BooleanDisplay from "./BooleanDisplay";
import { CellFilePreview } from "./CellFilePreview";
import { getStorageHandler } from "../../../files";

const TableCellContent =
  (type: ColumnType, options?: Enum[], bucket?: string) =>
  (context: CellContext<any, unknown>) => {
    const { getValue, row, column, cell } = context;
    const { tableId } = useDataViewCore();
    const store = getEditingStore(tableId);
    const editMode = store((s) => s.editMode);
    const editingCell = store((s) => s.editingCell);
    const columnName = column.columnDef.meta?.columnName ?? column.id;
    const pendingKey = column.columnDef.meta?.editingField ?? columnName;
    const pendingRow = store((s) => s.pendingEdits[row.id]);
    const pending = pendingRow?.[pendingKey];

    const editableField = column.columnDef.meta?.editableField;
    const isDirty = pending !== undefined;
    const accessorFn = column.accessorFn as
      | ((row: Record<string, unknown>, index: number) => unknown)
      | undefined;
    const value = isDirty
      ? (accessorFn?.(
          { ...(row.original as Record<string, unknown>), ...pendingRow },
          0,
        ) ?? pending)
      : getValue();
    const label = formatByType(value, type, options);

    if (
      editMode &&
      editingCell?.rowId === row.id &&
      editingCell?.columnId === column.id
    ) {
      if (editableField) return <EditableCell cell={cell} />;
      // Clicked "Edit" on a column with no matching field — show it the
      // same way EditableCell shows a row-level readonly field, instead of
      // pretending it's editable.
      return (
        <span className="truncate text-muted-foreground ms-2">{label}</span>
      );
    }

    const content = (() => {
      if (type === "boolean")
        return <BooleanDisplay value={value as boolean} title={label} />;

      if (type === "file") {
        const path = String(value ?? "");
        if (!path) return null;
        return (
          <CellFilePreview
            src={getStorageHandler().getPublicUrl({
              bucket: bucket ?? "",
              path,
            })}
            path={path}
          />
        );
      }

      if (
        ["date", "datetime", "time", "select", "json"].includes(type) ||
        options
      ) {
        return <span title={label}>{label}</span>;
      }

      return <span title={String(value ?? "")}>{String(value ?? "")}</span>;
    })();

    if (!isDirty) return content;

    return (
      <span
        className={cn(
          "inline-flex max-w-full items-center rounded px-1",
          "bg-amber-500/15",
        )}
      >
        {content}
      </span>
    );
  };

export default TableCellContent;
