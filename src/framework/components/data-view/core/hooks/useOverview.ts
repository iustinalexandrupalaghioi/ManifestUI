"use client";

import { useMemo, useState } from "react";
import { getItemId } from "@/framework/core/resource-id";

export function useOverviewState() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const dataTableProps = useMemo(
    () => ({
      rowSelection,
      setRowSelection,
    }),
    [rowSelection],
  );

  return {
    rowSelection,
    setRowSelection,
    dataTableProps,
  };
}

export function useOverviewSelection<T>(
  data: T[],
  rowSelection: Record<string, boolean>,
  idField = "id",
) {
  const selectedRows = useMemo(
    () =>
      data.filter((row, i) => {
        const id = getItemId(row as Record<string, unknown>, idField);
        return rowSelection[id ?? String(i)];
      }),
    [data, rowSelection, idField],
  );
  return { selectedRows, selectedCount: selectedRows.length };
}
