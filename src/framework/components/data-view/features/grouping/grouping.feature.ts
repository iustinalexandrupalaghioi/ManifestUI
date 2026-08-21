import type { DataViewFeature } from "../../core/contracts"

// No useFeature hook — wired directly into TableViewLayout.
export const groupingFeature: DataViewFeature = {
  id: "grouping",
}
