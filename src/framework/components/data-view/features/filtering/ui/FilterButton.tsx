import { Button } from "@/framework/components/ui/button"
import { cn } from "@/framework/lib/utils"
import { FilterIcon } from "lucide-react"
import { getFilteringStore } from "../filtering.store"

interface FilterButtonProps {
  viewId: string
  tableId: string
  onOpen: (columnId?: string) => void
}

export function FilterButton({ viewId, tableId, onOpen }: FilterButtonProps) {
  const activeCount = getFilteringStore(tableId, viewId)((s) => s.rules.length)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onOpen()}
      title="Filters"
      className="relative"
      type="button"
    >
      <FilterIcon />
      Filters
      {activeCount > 0 && (
        <span
          className={cn(
            "absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center",
            "rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
          )}
        >
          {activeCount}
        </span>
      )}
    </Button>
  )
}
