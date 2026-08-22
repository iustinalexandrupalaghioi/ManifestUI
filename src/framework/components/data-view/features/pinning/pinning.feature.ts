import type { DataViewFeature } from "../../core/contracts"

/**
 * PinningFeature
 *
 * Registers column pinning in the feature registry. No useFeature hook —
 * useDataView gates which persisted user-pinned columns get applied to the
 * live table, and the pin-toggle affordances read featureIds from
 * DataViewCoreCtx directly. System columns stay force-pinned regardless.
 */
export const pinningFeature: DataViewFeature = {
  id: "pinning",
}
