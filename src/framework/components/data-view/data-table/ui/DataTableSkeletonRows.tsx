"use client";

import { CustomTableCell, CustomTableRow } from "@/framework/components/ui/CustomTable";
import { cn } from "@/framework/lib/utils";

const SKELETON_ROW_COUNT = 12;
/** Placeholder rows while the first page loads. */
export function SkeletonRows({
  columnsLength,
  lastColumnId,
}: {
  columnsLength: number;
  lastColumnId: string | undefined;
}) {
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
        <CustomTableRow key={rowIndex} className="odd:bg-muted/60">
          {Array.from({ length: columnsLength }).map((_, colIndex) => {
            const isLast = colIndex === columnsLength - 1;
            const colId = isLast ? lastColumnId : `col-${colIndex}`;

            return (
              <CustomTableCell
                key={colIndex}
                style={{
                  width: isLast
                    ? undefined
                    : `calc(var(--col-${colId}-size) * 1px)`,
                  minWidth: isLast
                    ? undefined
                    : `calc(var(--col-${colId}-size) * 1px)`,
                  maxWidth: isLast
                    ? undefined
                    : `calc(var(--col-${colId}-size) * 1px)`,
                }}
                className="relative h-0 border-r border-b px-3"
              >
                <div
                  className={cn(
                    "h-4 animate-pulse rounded-full bg-muted-foreground/15",
                    rowIndex % 3 === 0 && colIndex % 2 === 0 && "w-3/4",
                    rowIndex % 3 === 1 && colIndex % 2 === 0 && "w-1/2",
                    rowIndex % 3 === 2 && colIndex % 2 === 0 && "w-2/3",
                    colIndex % 2 !== 0 && "w-4/5",
                    colIndex === 0 && "-ms-2 w-3",
                    colIndex === 1 && "w-3",
                  )}
                />
              </CustomTableCell>
            );
          })}
        </CustomTableRow>
      ))}
    </>
  );
}
