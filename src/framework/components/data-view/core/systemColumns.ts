// Always-pinned-left system columns (expand/group, row selection, actions).
// Shared between useDataView.tsx (which forces them into columnPinning/
// columnOrder) and the row renderers (which merge them into a single cell
// on group-header and totals rows, since they're always blank there).
export const SYSTEM_COLUMN_IDS = ["group", "select", "columns"];
