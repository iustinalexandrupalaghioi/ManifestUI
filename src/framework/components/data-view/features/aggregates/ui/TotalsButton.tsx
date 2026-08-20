import { Button } from "@/components/ui/button"
import { cn } from "@/framework/lib/utils"
import { SigmaIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { AggregateRule } from "../aggregates"

interface TotalsButtonProps {
  rules: AggregateRule[]
  onOpen: () => void
}

export function TotalsButton({ rules, onOpen }: TotalsButtonProps) {
  const t = useTranslations("Aggregates")
  const activeCount = rules?.length ?? 0

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onOpen}
      title={t("totals")}
      className="relative"
      type="button"
    >
      <SigmaIcon />
      {t("totals")}
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
