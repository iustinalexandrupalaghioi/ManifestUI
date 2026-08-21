"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Row, Table } from "@tanstack/react-table";
import { countLeafRows } from "../../features/grouping/grouping";
import { GroupValueDisplay } from "../../features/grouping/ui/GroupValueDisplay";

interface DataListGroupHeaderProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
}

export function DataListGroupHeader<TData>({
  row,
  table,
}: DataListGroupHeaderProps<TData>) {
  const t = useTranslations("Grouping");

  const groupingColumnId = row.groupingColumnId!;
  const meta = table.getColumn(groupingColumnId)?.columnDef.meta;
  const columnType = meta?.columnType ?? "text";
  const label = meta?.columnLabel ?? groupingColumnId;

  return (
    <div
      className="col-span-full flex flex-wrap items-center gap-1 border-b bg-muted/40 px-2 py-1.5 text-xs"
      style={{ paddingLeft: `${row.depth * 20 + 8}px` }}
    >
      <button
        type="button"
        className="mr-1 inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground"
        onClick={row.getToggleExpandedHandler()}
        aria-label={t("groupBy")}
      >
        {row.getIsExpanded() ? (
          <ChevronDownIcon className="size-3.5" />
        ) : (
          <ChevronRightIcon className="size-3.5" />
        )}
      </button>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-semibold">
        <GroupValueDisplay
          value={row.getValue(groupingColumnId)}
          type={columnType}
          options={meta?.selectOptions}
          bucket={meta?.bucket}
        />
      </span>
      <span className="text-muted-foreground">({countLeafRows(row)})</span>
    </div>
  );
}
