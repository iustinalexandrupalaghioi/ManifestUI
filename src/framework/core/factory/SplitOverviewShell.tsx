"use client";

import { cn } from "@/framework/lib/utils";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
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
  onOpenChange,
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
  const availableHeight = useAvailableHeight(containerRef);

  const [width, setWidth] = useState(splitConfig.defaultWidth);
  const paneRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [mainCollapsed, setMainCollapsed] = useState(false);

  useEffect(() => {
    if (!open) setMainCollapsed(false);
  }, [open]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mainCollapsed) return;
      e.preventDefault();
      draggingRef.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [mainCollapsed],
  );

  useEffect(() => {
    function computePercent(clientX: number) {
      const rect = containerRef.current!.getBoundingClientRect();
      const rawPx =
        splitConfig.side === "right"
          ? rect.right - clientX
          : clientX - rect.left;
      const rawPercent = (rawPx / rect.width) * 100;
      return Math.min(
        splitConfig.maxWidth,
        Math.max(splitConfig.minWidth, rawPercent),
      );
    }
    function onPointerMove(e: PointerEvent) {
      if (!draggingRef.current || !containerRef.current || !paneRef.current)
        return;
      paneRef.current.style.width = `${computePercent(e.clientX)}%`;
    }
    function onPointerUp(e: PointerEvent) {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (containerRef.current) setWidth(computePercent(e.clientX));
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [splitConfig.minWidth, splitConfig.maxWidth, splitConfig.side]);

  const paneVisible = open || !splitConfig.collapsible;

  const mainSide = splitConfig.side === "right" ? "left" : "right";
  const CollapseIcon = mainSide === "left" ? PanelLeftClose : PanelRightClose;
  const ExpandIcon = mainSide === "left" ? PanelLeftOpen : PanelRightOpen;

  const resizeHandle = (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={handlePointerDown}
      className={cn(
        "group relative w-2.5 shrink-0 touch-none select-none",
        mainCollapsed ? "cursor-default" : "cursor-col-resize",
      )}
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary group-active:bg-primary" />
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
      style={{ width: mainCollapsed ? undefined : `${width}%` }}
      className={cn(
        "h-full min-w-0 overflow-hidden bg-background",
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
      className="flex w-full overflow-hidden"
    >
      {splitConfig.side === "left" && paneVisible && (
        <>
          {pane}
          {resizeHandle}
        </>
      )}

      <div
        className={cn(
          "h-full overflow-hidden transition-[flex-basis]",
          mainCollapsed ? "w-0 min-w-0 flex-none" : "min-w-0 flex-1",
        )}
      >
        {main}
      </div>

      {splitConfig.side === "right" && paneVisible && (
        <>
          {resizeHandle}
          {pane}
        </>
      )}
    </div>
  );
}
