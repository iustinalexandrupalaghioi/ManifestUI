import { Button } from "@/components/ui/button";
import { LayoutGridIcon, TableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getViewModeStore,
  useActiveMode,
} from "../../core/stores/ViewModeStore";
import { getSelectionStore } from "../../features/selection";

interface DataListModeToggleProps {
  tableId: string;
  hasList: boolean;
  /** The page toolbar's segmented Cards | Table, with text labels. */
  labeled?: boolean;
}

/**
 * ModeToggle
 *
 * Renders the table/list mode toggle buttons. Only renders when the table
 * was configured with list support (initialListColumnVisibility provided).
 *
 * On switch: updates ViewModeStore and restores the last-used view for
 * the target mode so the user lands where they left off.
 */
export function DataListModeToggle({
  tableId,
  hasList,
  labeled,
}: DataListModeToggleProps) {
  const t = useTranslations("DataView");
  const activeMode = useActiveMode(tableId);

  if (!hasList) return null;

  const isList = activeMode === "list";

  const switchToTable = () => {
    getSelectionStore(tableId).getState().setRowSelection({});
    getViewModeStore(tableId).getState().setMode("table");
  };

  const switchToList = () => {
    getSelectionStore(tableId).getState().setRowSelection({});
    getViewModeStore(tableId).getState().setMode("list");
  };

  if (labeled) {
    // Segmented Cards | Table: icon and text (text hidden on phones), the active one in the accent.
    const segment =
      "inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-7 [&_svg]:size-4 aria-pressed:bg-link aria-pressed:text-background text-muted-foreground hover:text-foreground aria-pressed:hover:text-background";
    return (
      <div role="group" aria-label={t("viewMode")} className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
        <button type="button" aria-pressed={isList} aria-label={t("cards")} onClick={switchToList} className={segment}>
          <LayoutGridIcon aria-hidden />
          <span className="hidden sm:inline">{t("cards")}</span>
        </button>
        <button type="button" aria-pressed={!isList} aria-label={t("table")} onClick={switchToTable} className={segment}>
          <TableIcon aria-hidden />
          <span className="hidden sm:inline">{t("table")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center bg-muted rounded-md me-2">
      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        title={t("listView")}
        onClick={switchToList}
        className={`${isList ? "text-primary" : "text-muted-foreground"}`}
      >
        <LayoutGridIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        title={t("tableView")}
        onClick={switchToTable}
        className={`${!isList ? "text-primary" : "text-muted-foreground"}`}
      >
        <TableIcon />
      </Button>
    </div>
  );
}
