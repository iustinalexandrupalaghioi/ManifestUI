import type { DataViewFeature } from "../../core/contracts"

/**
 * SortingFeature
 *
 * Registers sorting in the feature registry. No useFeature hook needed —
 * sorting is fully controlled via useDataView's state.sorting and
 * onSortingChange. useSorting must NOT be called here: its internal
 * useEffect calls table.setSorting() on mount which triggers onSortingChange
 * → updateTableDraft, creating a spurious unsaved-changes indicator.
 */
export const sortingFeature: DataViewFeature = {
  id: "sorting",
}
