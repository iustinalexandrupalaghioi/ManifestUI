"use client";

import type { ReactNode } from "react";
import { EventHoverCard } from "./EventHoverCard";

interface EventDotProps {
  content?: ReactNode;
  className?: string;
  selected?: boolean;
  onToggle?: () => void;
  onSelectOnly?: () => void;
}

export function EventDot({
  content,
  className,
  selected,
  onToggle,
  onSelectOnly,
}: EventDotProps) {
  const dot = (
    <span
      className={`block h-2.5 w-2.5 shrink-0 rounded-full transition-transform hover:scale-125 ${
        className ?? "bg-primary"
      } ${selected ? "ring-2 ring-foreground ring-offset-1 ring-offset-background" : ""}`}
    />
  );

  const trigger = (
    <span
      role="button"
      tabIndex={0}
      className="flex items-center justify-center p-0.5"
      onClick={(e) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) onToggle?.();
        else (onSelectOnly ?? onToggle)?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          onToggle?.();
        }
      }}
    >
      {dot}
    </span>
  );

  return <EventHoverCard content={content}>{trigger}</EventHoverCard>;
}
