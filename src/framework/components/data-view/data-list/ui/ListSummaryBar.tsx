"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Loader2Icon,
  PanelBottomClose,
  PanelBottomIcon,
  PanelBottomOpen,
  PanelLeftClose,
  PanelLeftIcon,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightIcon,
  PanelRightOpen,
  PanelTopClose,
  PanelTopIcon,
  PanelTopOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  AggregateResult,
  AggregateRule,
} from "../../features/aggregates/aggregates";
import {
  aggregateResultKey,
  formatAggregateLabel,
} from "../../features/aggregates/aggregates";

export type SummaryPosition = "left" | "right" | "top" | "bottom";

const THIN_SCROLLBAR =
  "scrollbar-thumb-rounded scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80";

// row min must fit the header's label + 6 icon buttons, or a dragged-down
// bar hides some of them with no way to reach them.
const SIZE_LIMITS = { row: [200, 480], column: [56, 280] } as const;

// Default follows viewport (desktop → right, mobile → bottom) until the
// user overrides it via the dock controls. `size: null` means "auto" —
// intrinsic, shrink-to-fit content — until the user drags the handle.
// Mobile never allows left/right — there's no room for a sidebar next to
// the list — so a stale override from a wider viewport is ignored there.
export function useSummaryPosition() {
  const isMobile = useIsMobile();
  const [override, setOverride] = useState<SummaryPosition | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [size, setSize] = useState<number | null>(null);

  const isSideways = override === "left" || override === "right";
  const position = isMobile
    ? isSideways
      ? "bottom"
      : (override ?? "bottom")
    : (override ?? "right");

  return {
    position,
    setPosition: setOverride,
    collapsed,
    toggleCollapsed: () => setCollapsed((c) => !c),
    size,
    setSize,
    isMobile,
  } as const;
}

interface ListSummaryBarProps {
  rules: AggregateRule[];
  values?: AggregateResult;
  isFetching?: boolean;
  position: SummaryPosition;
  onPositionChange: (position: SummaryPosition) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  size: number | null;
  onSizeChange: (size: number | null) => void;
  isMobile: boolean;
}

const DOCK_OPTIONS: { value: SummaryPosition; icon: typeof PanelLeftIcon }[] = [
  { value: "left", icon: PanelLeftIcon },
  { value: "top", icon: PanelTopIcon },
  { value: "right", icon: PanelRightIcon },
  { value: "bottom", icon: PanelBottomIcon },
];

const COLLAPSE_ICONS = {
  left: { collapse: PanelLeftClose, expand: PanelLeftOpen },
  right: { collapse: PanelRightClose, expand: PanelRightOpen },
  top: { collapse: PanelTopClose, expand: PanelTopOpen },
  bottom: { collapse: PanelBottomClose, expand: PanelBottomOpen },
};

export function ListSummaryBar({
  rules,
  values,
  isFetching,
  position,
  onPositionChange,
  collapsed,
  onToggleCollapsed,
  size,
  onSizeChange,
  isMobile,
}: ListSummaryBarProps) {
  const t = useTranslations("Aggregates");
  const isRow = position === "left" || position === "right";
  const dimension = isRow ? "row" : "column";
  const [min, max] = SIZE_LIMITS[dimension];
  const dockOptions = isMobile
    ? DOCK_OPTIONS.filter((o) => o.value !== "left" && o.value !== "right")
    : DOCK_OPTIONS;

  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastPointerDownRef = useRef(0);

  const borderSide = {
    left: "border-r",
    right: "border-l",
    top: "border-b",
    bottom: "border-t",
  }[position];
  const CollapseIcon = collapsed
    ? COLLAPSE_ICONS[position].expand
    : COLLAPSE_ICONS[position].collapse;

  useEffect(() => {
    function computeSize(clientX: number, clientY: number) {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const raw =
        position === "left"
          ? clientX - rect.left
          : position === "right"
            ? rect.right - clientX
            : position === "top"
              ? clientY - rect.top
              : rect.bottom - clientY;
      return Math.min(max, Math.max(min, raw));
    }
    function onPointerMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      const next = computeSize(e.clientX, e.clientY);
      if (next !== null) onSizeChange(next);
    }
    function onPointerUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [position, min, max, onSizeChange]);

  // Manual double-tap detection instead of onDoubleClick — preventDefault()
  // on pointerdown (needed to stop text selection while dragging) can
  // suppress the browser's synthesized click events dblclick depends on.
  const handlePointerDown = (e: React.PointerEvent) => {
    const now = Date.now();
    if (now - lastPointerDownRef.current < 350) {
      lastPointerDownRef.current = 0;
      onSizeChange(null); // reset to auto/intrinsic sizing
      return;
    }
    lastPointerDownRef.current = now;
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = isRow ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  };

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-muted/30",
          isRow ? `w-8 ${borderSide}` : `h-8 ${borderSide}`,
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          title={t("totals")}
          onClick={onToggleCollapsed}
        >
          <CollapseIcon className="size-3.5" />
        </Button>
      </div>
    );
  }

  // Clamp defensively in render too, not just while dragging — a size
  // stored before SIZE_LIMITS changed (or from any other stale state)
  // should never render smaller than what the header controls need.
  const clampedSize = size === null ? null : Math.min(max, Math.max(min, size));

  return (
    <div
      ref={barRef}
      style={{
        width: isRow ? (clampedSize ?? undefined) : undefined,
        height: isRow ? undefined : (clampedSize ?? undefined),
      }}
      className={cn(
        "relative flex min-h-0 min-w-0 shrink-0 flex-col gap-2 bg-muted/30 p-2",
        borderSide,
        isRow ? "w-fit max-w-[70vw]" : "h-fit max-h-[50vh]",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          {t("totals")}
        </span>
        <div className="flex items-center gap-0.5">
          {dockOptions.map(({ value, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              variant={position === value ? "secondary" : "ghost"}
              size="icon"
              className="size-6"
              onClick={() => onPositionChange(value)}
            >
              <Icon className="size-3" />
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            title={t("collapse")}
            onClick={onToggleCollapsed}
          >
            <CollapseIcon className="size-3" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 gap-2",
          isRow
            ? `grid grid-cols-[max-content] justify-start overflow-y-auto ${THIN_SCROLLBAR}`
            : `flex flex-row items-start overflow-x-auto overflow-y-auto pb-1 ${THIN_SCROLLBAR}`,
        )}
      >
        {rules.map((rule) => (
          <div
            key={rule.columnId}
            className="shrink-0 rounded-md border bg-background py-1.5 px-2.5 text-xs"
          >
            <div className="text-muted-foreground whitespace-nowrap">
              {rule.columnLabel}
            </div>
            <div className="font-medium whitespace-nowrap">
              {isFetching ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                formatAggregateLabel(
                  rule,
                  values?.[aggregateResultKey(rule)],
                  t,
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        role="separator"
        aria-orientation={isRow ? "vertical" : "horizontal"}
        onPointerDown={handlePointerDown}
        title={t("resize")}
        className={cn(
          "group absolute touch-none select-none",
          isRow
            ? cn(
                "top-0 h-full w-2.5 cursor-col-resize",
                position === "left"
                  ? "right-0 translate-x-1/2"
                  : "left-0 -translate-x-1/2",
              )
            : cn(
                "left-0 h-2.5 w-full cursor-row-resize",
                position === "top"
                  ? "bottom-0 translate-y-1/2"
                  : "top-0 -translate-y-1/2",
              ),
        )}
      >
        <div
          className={cn(
            "absolute bg-border transition-colors group-hover:bg-primary group-active:bg-primary",
            isRow
              ? "inset-y-0 left-1/2 w-px -translate-x-1/2"
              : "inset-x-0 top-1/2 h-px -translate-y-1/2",
          )}
        />
      </div>
    </div>
  );
}
