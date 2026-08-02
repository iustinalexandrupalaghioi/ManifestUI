import { formatByType } from "@/framework/lib/utils";
import type { Enum } from "@/framework/types/global/Enum";
import type { ColumnType } from "../../features/filtering/filters";
import BooleanDisplay from "./BooleanDisplay";
import { CellFilePreview } from "./CellFilePreview";
import { getStorageHandler } from "../../../files";

const TableCellContent =
  (type: ColumnType, options?: Enum[], bucket?: string) =>
  ({ getValue }: { getValue: () => unknown }) => {
    const value = getValue();
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
  };

export default TableCellContent;
