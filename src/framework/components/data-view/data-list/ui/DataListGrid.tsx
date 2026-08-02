import { type Column, type Row } from "@tanstack/react-table";
import { useDataViewCore } from "../../core/stores/DataViewProvider";
import { useSelection } from "../../features/selection/useSelection";
import { DataListItem } from "./DataListItem";

function SkeletonItem() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="h-4 w-1/3 animate-pulse rounded-full bg-muted-foreground/15" />
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted-foreground/10" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted-foreground/10" />
      <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted-foreground/10" />
    </div>
  );
}

export interface DataListGridProps<TData> {
  rows: Row<TData>[];
  visibleListColumns: Column<TData>[];
  isLoading: boolean;
}

// No scroll container — owned by DataViewLayout's shared scroll div
export function DataListGrid<TData>({
  rows,
  visibleListColumns,
  isLoading,
}: DataListGridProps<TData>) {
  const { table, tableId } = useDataViewCore();
  const { handleRowClick } = useSelection(tableId, table);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-1 sm:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonItem key={i} />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No results.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-1 sm:grid-cols-2 2xl:grid-cols-3">
      {rows.map((row) => (
        <DataListItem
          key={row.id}
          row={row}
          visibleListColumns={visibleListColumns}
          onRowClick={handleRowClick}
        />
      ))}
    </div>
  );
}
