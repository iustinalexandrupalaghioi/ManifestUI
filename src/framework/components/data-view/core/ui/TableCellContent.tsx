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
    const armed = store((s) => s.armed);
    const editingCell = store((s) => s.editingCell);
    const columnName = column.columnDef.meta?.columnName ?? column.id;
    const pendingRow = store((s) => s.pendingEdits[row.id]);
    const pending = pendingRow?.[columnName];

    const editableField = column.columnDef.meta?.editableField;
    if (
      armed &&
      editingCell?.rowId === row.id &&
      editingCell?.columnId === column.id &&
      editableField
    ) {
      return <EditableCell cell={cell} />;
    }

    const isDirty = pending !== undefined;
    const value = isDirty ? pending : getValue();
    const label = formatByType(value, type, options);

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
      <span className={cn("-mx-1 rounded px-1", "bg-amber-500/15")}>
        {content}
      </span>
    );
  };

export default TableCellContent;
