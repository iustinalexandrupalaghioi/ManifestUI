import type { DataViewFeature } from "../../core/contracts"
import { FilterPanelSlot } from "./ui/FilterPanelSlot"

// FilterBar/FilterChipsBar are not registered as Toolbar — they live in
// row 2 (and the chips row below it) of each layout, gated inline via
// features.some, not row 1 where Toolbar renders.
export const filteringFeature: DataViewFeature = {
  id: "filtering",
  Panel: FilterPanelSlot,
}
