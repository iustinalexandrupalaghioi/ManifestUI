import type { DataViewFeature } from "../../core/contracts"

/**
 * ViewModeToggleFeature
 *
 * Registers the list/table mode toggle in the feature registry. No
 * useFeature hook — TableViewLayout/ListViewLayout gate the existing
 * DataListModeToggle render on features membership directly.
 */
export const viewModeToggleFeature: DataViewFeature = {
  id: "viewModeToggle",
}
