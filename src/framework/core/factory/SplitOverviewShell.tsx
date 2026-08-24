"use client";

import { cn } from "@/framework/lib/utils";
import {
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PanelTopClose,
  PanelTopOpen,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAvailableHeight } from "../../components/data-view/core/hooks/useAvailableHeight";
import type { SplitConfig } from "../../types/split-config-type";

const PANEL_ICONS = {
  left: [PanelLeftClose, PanelLeftOpen],
  right: [PanelRightClose, PanelRightOpen],
  top: [PanelTopClose, PanelTopOpen],
  bottom: [PanelBottomClose, PanelBottomOpen],
} as const;

// Deliberately NOT built on shadcn's Sidebar: that component renders its
// desktop panel as `position: fixed` positioned relative to the viewport —
// it's designed as a root-level app shell, not something nested inside an
// existing page with its own navbar. Fighting that (CSS containing-block
// tricks, overriding h-svh, etc.) was fragile. Plain flex layout here
// instead.
//
// Only ever rendered on tablet/desktop — createOverview falls back to plain
// full-page navigation on phone-sized viewports (a side-by-side split isn't
// viable there), so there's no mobile branch to handle here.
export function SplitOverviewShell({
  open,
  onOpenChange: _onOpenChange,
  splitConfig,
  main,
  detail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  splitConfig: Required<SplitConfig>;
  main: ReactNode;
  detail: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isVertical =
    splitConfig.side === "top" || splitConfig.side === "bottom";

  // Percentage of the split axis (width for left/right, height for
  // top/bottom) the detail pane occupies.
  const [size, setSize] = useState(splitConfig.defaultWidth);
  const paneRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [mainCollapsed, setMainCollapsed] = useState(false);

  const availableHeight = useAvailableHeight(containerRef, [mainCollapsed]);

  useEffect(() => {
    if (!open) setMainCollapsed(false);
  }, [open]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mainCollapsed) return;
      e.preventDefault();
      draggingRef.current = true;
      document.body.style.cursor = isVertical ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
    },
    [mainCollapsed, isVertical],
  );

  useEffect(() => {
    function computePercent(clientX: number, clientY: number) {
      const rect = containerRef.current!.getBoundingClientRect();
      const rawPx = isVertical
        ? splitConfig.side === "bottom"
          ? rect.bottom - clientY
          : clientY - rect.top
        : splitConfig.side === "right"
          ? rect.right - clientX
          : clientX - rect.left;
      const rawPercent =
        (rawPx / (isVertical ? rect.height : rect.width)) * 100;
      return Math.min(
        splitConfig.maxWidth,
        Math.max(splitConfig.minWidth, rawPercent),
      );
    }
    function onPointerMove(e: PointerEvent) {
      if (!draggingRef.current || !containerRef.current || !paneRef.current)
        return;
      const percent = computePercent(e.clientX, e.clientY);
      if (isVertical) paneRef.current.style.height = `${percent}%`;
      else paneRef.current.style.width = `${percent}%`;
    }
    function onPointerUp(e: PointerEvent) {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (containerRef.current) setSize(computePercent(e.clientX, e.clientY));
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [splitConfig.minWidth, splitConfig.maxWidth, splitConfig.side, isVertical]);

  const paneVisible = open || !splitConfig.collapsible;

  const mainSide = isVertical
    ? splitConfig.side === "top"
      ? "bottom"
      : "top"
    : splitConfig.side === "right"
      ? "left"
      : "right";
  const [CollapseIcon, ExpandIcon] = PANEL_ICONS[mainSide];

  const resizeHandle = (
    <div
      role="separator"
      aria-orientation={isVertical ? "horizontal" : "vertical"}
      onPointerDown={handlePointerDown}
      className={cn(
        "group relative shrink-0 touch-none select-none",
        isVertical ? "h-2.5 w-full" : "w-2.5",
        mainCollapsed
          ? "cursor-default"
          : isVertical
            ? "cursor-row-resize"
            : "cursor-col-resize",
      )}
    >
      <div
        className={cn(
          "absolute bg-border transition-colors group-hover:bg-primary group-active:bg-primary",
          isVertical
            ? "inset-x-0 top-1/2 h-px -translate-y-1/2"
            : "inset-y-0 left-1/2 w-px -translate-x-1/2",
        )}
      />
      <button
        type="button"
        onClick={() => setMainCollapsed((c) => !c)}
        title={mainCollapsed ? "Show list" : "Hide list"}
        className="absolute top-1/2 left-1/2 z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-foreground"
      >
        {mainCollapsed ? (
          <ExpandIcon className="size-4" />
        ) : (
          <CollapseIcon className="size-4" />
        )}
      </button>
    </div>
  );

  const pane = (
    <div
      ref={paneRef}
      style={
        mainCollapsed
          ? undefined
          : isVertical
            ? { height: `${size}%` }
            : { width: `${size}%` }
      }
      className={cn(
        "overflow-hidden bg-background",
        isVertical ? "w-full min-h-0" : "h-full min-w-0",
        mainCollapsed ? "flex-1" : "shrink-0",
      )}
    >
      {detail}
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{ height: availableHeight || undefined }}
      className={cn("flex w-full overflow-hidden", isVertical && "flex-col")}
    >
      {(splitConfig.side === "left" || splitConfig.side === "top") &&
        paneVisible && (
          <>
            {pane}
            {resizeHandle}
          </>
        )}

      <div
        className={cn(
          "overflow-hidden transition-[flex-basis]",
          isVertical
            ? cn(
                "w-full",
                mainCollapsed ? "h-0 min-h-0 flex-none" : "min-h-0 flex-1",
              )
            : cn(
                "h-full",
                mainCollapsed ? "w-0 min-w-0 flex-none" : "min-w-0 flex-1",
              ),
        )}
      >
        {main}
      </div>

      {(splitConfig.side === "right" || splitConfig.side === "bottom") &&
        paneVisible && (
          <>
            {resizeHandle}
            {pane}
          </>
        )}
    </div>
  );
}
