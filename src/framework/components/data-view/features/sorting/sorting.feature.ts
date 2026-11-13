import type { DataViewFeature } from "../../core/contracts"
import { SortPanelSlot } from "./ui/SortPanelSlot"

/**
 * SortingFeature
 *
 * No useFeature hook needed — sorting is fully controlled via
 * useDataView's state.sorting and onSortingChange. useSorting must NOT be
 * called here: its internal useEffect calls table.setSorting() on mount
 * which triggers onSortingChange → updateTableDraft, creating a spurious
 * unsaved-changes indicator.
 *
 * SortBar is not registered as Toolbar — it lives in row 2 of each layout
 * (gated inline via features.some), not row 1 where Toolbar renders.
 */
export const sortingFeature: DataViewFeature = {
  id: "sorting",
  Panel: SortPanelSlot,
}
