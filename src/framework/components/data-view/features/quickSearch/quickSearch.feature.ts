import type { DataViewFeature } from "../../core/contracts"

/**
 * QuickSearchFeature
 *
 * Registers global quick-search in the feature registry. No useFeature
 * hook — TableViewLayout/ListViewLayout gate QuickSearchButton/Input on
 * quickSearchEnabled && features membership directly.
 */
export const quickSearchFeature: DataViewFeature = {
  id: "quickSearch",
}
