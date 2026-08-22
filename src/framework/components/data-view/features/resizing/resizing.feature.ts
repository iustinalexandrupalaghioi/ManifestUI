import type { DataViewFeature } from "../../core/contracts"

/**
 * ResizingFeature
 *
 * Registers column resizing in the feature registry. No useFeature hook —
 * useDataView reads featureIds before constructing useReactTable and gates
 * enableColumnResizing/defaultColumn.enableResizing directly.
 */
export const resizingFeature: DataViewFeature = {
  id: "resizing",
}
