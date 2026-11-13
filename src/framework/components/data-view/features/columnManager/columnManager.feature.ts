import type { DataViewFeature } from "../../core/contracts"

/**
 * ColumnManagerFeature
 *
 * Registers the column manager sheet in the feature registry. No useFeature
 * hook — the column-header renderers that mount ColumnManagerButton read
 * featureIds from DataViewCoreCtx / the features prop directly.
 */
export const columnManagerFeature: DataViewFeature = {
  id: "columnManager",
}
