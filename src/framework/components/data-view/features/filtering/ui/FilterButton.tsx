import { Button } from "@/components/ui/button"
import { cn } from "@/framework/lib/utils"
import { FilterIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { getFilteringStore } from "../filtering.store"
import { useOptionalDataViewFilter } from "../../../core/stores/DataViewFilterContext"

interface FilterButtonProps {
  viewId: string
  tableId: string
  onOpen: (columnId?: string) => void
}

export function FilterButton({ viewId, tableId, onOpen }: FilterButtonProps) {
  const t = useTranslations("Filtering")
  const ruleCount = getFilteringStore(tableId, viewId)((s) => s.rules.length)
  // Filters applied from context (the URL's ?column=…, an embedded list's relation) count too:
  // they narrow the rows just the same, and the panel lists them under "Applied from context".
  const contextCount = useOptionalDataViewFilter()?.enrichedPreFilters.length ?? 0
  const activeCount = ruleCount + contextCount

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onOpen()}
      title={t("filters")}
      className="relative"
      type="button"
    >
      <FilterIcon />
      {t("filters")}
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
