import { Button } from "@/components/ui/button"
import { cn } from "@/framework/lib/utils"
import { Rows3Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { GroupByRule } from "../grouping"

interface GroupByButtonProps {
  grouping: GroupByRule[]
  onOpen: () => void
}

export function GroupByButton({ grouping, onOpen }: GroupByButtonProps) {
  const t = useTranslations("Grouping")
  const activeCount = grouping?.length ?? 0

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onOpen}
      title={t("groupBy")}
      className="relative"
      type="button"
    >
      <Rows3Icon />
      {t("groupBy")}
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
