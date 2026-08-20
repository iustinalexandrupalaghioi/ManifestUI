import type { DataViewFeature } from "../../core/contracts"

// No useFeature hook — wired directly into TableViewLayout/ListViewLayout.
export const aggregatesFeature: DataViewFeature = {
  id: "aggregates",
}
