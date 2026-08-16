import type { Cell } from "@tanstack/react-table";
import type { CellAddress } from "./editing.store";
import type { EditableFieldMeta } from "../../core/tanstack-augmentations";

export type { CellAddress };

export function isFieldEditableForRow(
  meta: EditableFieldMeta,
  rowData: Record<string, unknown>,
): boolean {
  const field = meta.kind === "direct" ? meta.field : meta.owningField;

  if (field.type === "readonly") return false;

  const hidden = "hidden" in field ? field.hidden : false;
  if (typeof hidden === "function" ? hidden(rowData) : hidden) return false;

  const readonly = "readonly" in field ? field.readonly : false;
  if (typeof readonly === "function" ? readonly(rowData) : readonly)
    return false;

  return true;
}

export function isEditableCell(cell: Cell<any, unknown>): boolean {
  return cell.column.columnDef.meta?.editableField != null;
}

export function isDirectlyTypable(cell: Cell<any, unknown>): boolean {
  return cell.column.columnDef.meta?.editableField?.kind === "direct";
}
