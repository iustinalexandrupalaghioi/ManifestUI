import { useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";
import { getSelectionStore } from "../selection.store";

interface SelectionToolbarProps {
  tableId: string;
  totalCount: number;
  className?: string;
}

/**
 * SelectionToolbar
 *
 * "N selected · M total". Rendered outside both TableViewContent and
 * ListViewContent because selection is shared across modes — the count
 * reflects the same state regardless of which view is active.
 *
 * Reads directly from SelectionStore so it only re-renders when the
 * selection count changes.
 */
export function SelectionToolbar({
  tableId,
  totalCount,
  className,
}: SelectionToolbarProps) {
  const t = useTranslations("DataView");
  const selectionCount = getSelectionStore(tableId)(
    (s) => Object.keys(s.rowSelection).length,
  );

  return (
    <span
      aria-live="polite"
      className={cn("text-sm whitespace-nowrap text-muted-foreground tabular-nums", className)}
    >
      {t("selectedOfTotal", { selected: selectionCount, total: totalCount })}
    </span>
  );
}
