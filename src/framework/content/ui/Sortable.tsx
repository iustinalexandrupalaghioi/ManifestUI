"use client";

import type { DragEndEvent } from "@dnd-kit/dom";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import { DragDropProvider, KeyboardSensor, PointerSensor } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import type { ReactNode, Ref } from "react";

const sensors = [
  PointerSensor.configure({
    activationConstraints: () => [new PointerActivationConstraints.Delay({ value: 100, tolerance: 10 })],
  }),
  KeyboardSensor,
];

/**
 * A drag-to-reorder list: renders each item through `children` with a ref for
 * the item and one for its drag handle, and reports moves by index. The
 * up/down buttons beside it keep reordering possible without a pointer.
 */
export function SortableList<T extends { id: string }>({
  items,
  onMove,
  group,
  children,
}: {
  items: readonly T[];
  onMove: (from: number, to: number) => void;
  /** Keeps nested lists from dragging into each other. */
  group: string;
  children: (item: T, index: number, refs: { ref: Ref<HTMLElement>; handleRef: Ref<HTMLElement>; isDragging: boolean }) => ReactNode;
}) {
  const onDragEnd = (event: DragEndEvent) => {
    if (event.canceled) return;
    const source = event.operation.source as { id?: unknown; sortable?: { initialIndex: number; index: number } } | null;
    if (!source?.sortable) return;
    const { initialIndex, index } = source.sortable;
    if (initialIndex !== index) onMove(initialIndex, index);
  };
  return (
    <DragDropProvider sensors={sensors} onDragEnd={onDragEnd}>
      {items.map((item, index) => (
        <SortableItem key={item.id} id={item.id} index={index} group={group}>
          {(refs) => children(item, index, refs)}
        </SortableItem>
      ))}
    </DragDropProvider>
  );
}

function SortableItem({
  id,
  index,
  group,
  children,
}: {
  id: string;
  index: number;
  group: string;
  children: (refs: { ref: Ref<HTMLElement>; handleRef: Ref<HTMLElement>; isDragging: boolean }) => ReactNode;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id, index, group, type: group, accept: group });
  return <>{children({ ref, handleRef, isDragging })}</>;
}
