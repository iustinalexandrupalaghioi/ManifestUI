import type { DataViewFeature } from "../../core/contracts"
import { EditControls } from "./ui/EditControls"

/**
 * EditingFeature
 *
 * Registers the inline-editing toolbar control (Edit / Save / Discard) in
 * row 1, next to ViewBar. Cell-level wiring (double-click, type-to-edit) is
 * done directly in DataTableBody via useEditing — no useFeature hook needed
 * here, matching how selection/filtering are registered.
 */
export const editingFeature: DataViewFeature = {
  id: "edit",
  Toolbar: EditControls,
}
