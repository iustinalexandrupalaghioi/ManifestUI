import type { DataViewFeature } from "../../core/contracts"

/**
 * FilteringFeature
 *
 * Registers filtering in the feature registry. No useFeature hook needed —
 * DataViewLayout subscribes to the filtering stores directly, and
 * useCellContextMenuFilter is registered in useDataView.
 */
export const filteringFeature: DataViewFeature = {
  id: "filtering",
}
