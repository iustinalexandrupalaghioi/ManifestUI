import type { DataViewFeature } from "../../core/contracts"

/**
 * SelectionFeature
 *
 * Registers selection in the feature registry. No useFeature hook needed —
 * DataViewBody calls useSelection directly with the table instance it
 * already has from DataViewProvider context.
 */
export const selectionFeature: DataViewFeature = {
  id: "selection",
}
