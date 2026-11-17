import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef } from "react";

/**
 * Virtualizes the grid's rows: which rows to render, the padding above and
 * below them, and a ref that measures each row once (not while columns are
 * resizing). Rows are measured again when the columns or the edited cell change.
 */
export function useRowVirtualizer({
  count,
  scrollContainerRef,
  isResizing,
  columnStateKey,
  editingKey,
}: {
  count: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isResizing: boolean;
  columnStateKey: unknown;
  editingKey: unknown;
}) {
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 33,
    overscan: isResizing ? 0 : 5,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalHeight - virtualRows[virtualRows.length - 1].end
      : 0;

  const isResizingRef = useRef(isResizing);
  isResizingRef.current = isResizing;
  const measureRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (!isResizingRef.current && node && !node.dataset.measured) {
        node.dataset.measured = "true";
        virtualizer.measureElement(node);
      }
    },
    [virtualizer],
  );

  const resetMeasuredRows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    for (const node of container.querySelectorAll<HTMLElement>(
      "[data-index]",
    )) {
      delete node.dataset.measured;
    }
  };

  useEffect(() => {
    resetMeasuredRows();
    virtualizer.measure();
  }, [columnStateKey]);

  useEffect(() => {
    resetMeasuredRows();
    virtualizer.measure();
  }, [editingKey]);

  return { virtualRows, paddingTop, paddingBottom, measureRef };
}
