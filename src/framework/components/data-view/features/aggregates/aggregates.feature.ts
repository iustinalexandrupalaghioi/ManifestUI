import type { DataViewFeature } from "../../core/contracts"
import { TotalsPanelSlot } from "./ui/TotalsPanelSlot"

// TotalsBar is not registered as Toolbar — it lives in row 2 of each
// layout (gated inline via features.some), not row 1 where Toolbar renders.
export const aggregatesFeature: DataViewFeature = {
  id: "aggregates",
  Panel: TotalsPanelSlot,
}
