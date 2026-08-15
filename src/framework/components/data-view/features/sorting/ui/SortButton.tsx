import { Button } from "@/components/ui/button"
import { cn } from "@/framework/lib/utils"
import { ArrowUpDown } from "lucide-react"
import { useTranslations } from "next-intl"
import type { SortingState } from "@tanstack/react-table"

interface SortButtonProps {
  sorting: SortingState
  onOpen: () => void
}

export function SortButton({ sorting, onOpen }: SortButtonProps) {
  const t = useTranslations("Sorting")
  const activeCount = sorting.length

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onOpen}
      title={t("sort")}
      className="relative"
      type="button"
    >
      <ArrowUpDown />
      {t("sort")}
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
