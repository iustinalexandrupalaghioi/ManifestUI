// Pinned-left sticky offsets normally come from column.getStart("left")
//
// This computes the same offset as a CSS calc() over those same vars, so
// it tracks the live drag exactly like column width already does — no
// React state involved.
export function pinnedLeftOffset(
  pinnedLeftIds: readonly string[],
  columnId: string,
): string | number | undefined {
  const index = pinnedLeftIds.indexOf(columnId);
  if (index < 0) return undefined;
  if (index === 0) return 0;
  const precedingVars = pinnedLeftIds
    .slice(0, index)
    .map((id) => `var(--col-${id}-size) * 1px`)
    .join(" + ");
  return `calc(${precedingVars})`;
}
