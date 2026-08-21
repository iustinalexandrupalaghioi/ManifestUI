import { formatByType } from "@/framework/lib/utils";
import type { Enum } from "@/framework/types/global/Enum";
import type { ColumnType } from "../../features/filtering/filters";
import BooleanDisplay from "./BooleanDisplay";
import { CellFilePreview } from "./CellFilePreview";
import { getStorageHandler } from "../../../files";

interface CellValueDisplayProps {
  value: unknown;
  type: ColumnType;
  options?: Enum[];
  bucket?: string;
}

// The type-specific rendering TableCellContent uses for a real data cell —
// factored out so anywhere else that needs to show a raw value the same way
// (e.g. a grouped row's label) can reuse it, without the editing/dirty-state
// wrapper that only makes sense for an actual table cell.
export function CellValueDisplay({
  value,
  type,
  options,
  bucket,
}: CellValueDisplayProps) {
  const label = formatByType(value, type, options);

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
}
