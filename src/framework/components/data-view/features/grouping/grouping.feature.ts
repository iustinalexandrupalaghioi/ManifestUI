import type { DataViewFeature } from "../../core/contracts"
import { GroupByPanelSlot } from "./ui/GroupByPanelSlot"

// GroupByBar is not registered as Toolbar — it lives in row 2 of each
// layout (gated inline via features.some), not row 1 where Toolbar renders.
export const groupingFeature: DataViewFeature = {
  id: "grouping",
  Panel: GroupByPanelSlot,
}
