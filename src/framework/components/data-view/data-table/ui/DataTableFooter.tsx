import {
  CustomTableFooter,
  CustomTableCell,
  CustomTableRow,
} from "@/framework/components/ui/CustomTable"
import { cn } from "@/framework/lib/utils"
import { Loader2Icon } from "lucide-react"
import { useDataViewCore } from "../../core/stores/DataViewProvider"
import type { AggregateResult, AggregateRule } from "../../features/aggregates/aggregates"
import { aggregateResultKey, formatAggregateLabel } from "../../features/aggregates/aggregates"

interface DataTableFooterProps {
  aggregateRules: AggregateRule[]
  aggregateValues?: AggregateResult
  isAggregatesFetching?: boolean
}

export function DataTableFooter({
  aggregateRules,
  aggregateValues,
  isAggregatesFetching,
}: DataTableFooterProps) {
  const { table } = useDataViewCore()
  if (aggregateRules.length === 0) return null

  const leafColumns = table.getVisibleLeafColumns()
  const lastLeafColumnId = leafColumns.at(-1)?.id

  return (
    <CustomTableFooter className="bg-background">
      <CustomTableRow>
        {leafColumns.map((col) => {
          const isLast = col.id === lastLeafColumnId
          const isPinned = col.getIsPinned()
          const rule = aggregateRules.find((r) => r.columnId === col.id)

          return (
            <CustomTableCell
              key={col.id}
              style={{
                position: "sticky",
                bottom: 0,
                left: isPinned ? col.getStart("left") : undefined,
                // Above the body's pinned cells (z-20) and the header's
                // (z-30) so a pinned row column never renders over the
                // footer at the sticky-bottom/sticky-left corner.
                zIndex: isPinned ? 35 : 25,
                width: isLast
                  ? undefined
                  : `calc(var(--col-${col.id}-size) * 1px)`,
                minWidth: isLast
                  ? undefined
                  : `calc(var(--col-${col.id}-size) * 1px)`,
                maxWidth: isLast
                  ? undefined
                  : `calc(var(--col-${col.id}-size) * 1px)`,
              }}
              className={cn(
                "h-8 border-t px-3 text-xs font-medium",
                "overflow-hidden bg-background whitespace-nowrap",
                !isLast && "border-r",
                isPinned && "bg-background",
              )}
            >
              {rule &&
                (isAggregatesFetching ? (
                  <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
                ) : (
                  formatAggregateLabel(
                    rule,
                    aggregateValues?.[aggregateResultKey(rule)],
                  )
                ))}
            </CustomTableCell>
          )
        })}
      </CustomTableRow>
    </CustomTableFooter>
  )
}
