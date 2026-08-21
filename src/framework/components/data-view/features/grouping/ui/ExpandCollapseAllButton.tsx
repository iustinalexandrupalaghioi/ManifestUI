import { Button } from "@/components/ui/button"
import { FoldVerticalIcon, UnfoldVerticalIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Table } from "@tanstack/react-table"

interface ExpandCollapseAllButtonProps {
  table: Table<any>
}

export function ExpandCollapseAllButton({ table }: ExpandCollapseAllButtonProps) {
  const t = useTranslations("Grouping")
  const isAllExpanded = table.getIsAllRowsExpanded()

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      title={isAllExpanded ? t("collapseAll") : t("expandAll")}
      onClick={() => table.toggleAllRowsExpanded(!isAllExpanded)}
    >
      {isAllExpanded ? <FoldVerticalIcon /> : <UnfoldVerticalIcon />}
      {isAllExpanded ? t("collapseAll") : t("expandAll")}
    </Button>
  )
}
