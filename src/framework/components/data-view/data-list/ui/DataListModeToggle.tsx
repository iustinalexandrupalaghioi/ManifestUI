import { Button } from "@/framework/components/ui/button";
import { LayoutGridIcon, TableIcon } from "lucide-react";
import {
  getViewModeStore,
  useActiveMode,
} from "../../core/stores/ViewModeStore";
import { getSelectionStore } from "../../features/selection";

interface DataListModeToggleProps {
  tableId: string;
  hasList: boolean;
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
}: DataListModeToggleProps) {
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

  return (
    <div className="flex items-center bg-muted rounded-md me-2">
      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        title="List view"
        onClick={switchToList}
        className={`${isList ? "text-primary" : "text-muted-foreground"}`}
      >
        <LayoutGridIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        title="Table view"
        onClick={switchToTable}
        className={`${!isList ? "text-primary" : "text-muted-foreground"}`}
      >
        <TableIcon />
      </Button>
    </div>
  );
}
