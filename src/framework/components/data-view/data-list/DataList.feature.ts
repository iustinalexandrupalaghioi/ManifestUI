import type { DataViewFeature } from "../core/contracts"

/**
 * ListFeature
 *
 * Registers list in the feature registry. No useFeature hook needed —
 * DataViewLayout calls useDataList directly to get the ListFeatureApi
 * needed by DataList.
 */
export const listFeature: DataViewFeature = {
  id: "list",
}
