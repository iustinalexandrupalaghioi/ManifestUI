"use client";

import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The record screen's right-hand pane (the live preview): beside the tab
 * content, the full height of the scroll area, resizable by its left edge
 * (drag, or the arrow keys on the handle). Hidden below `lg`. `fullscreen`
 * spreads it over the whole browser tab (same element, so a frame inside
 * isn't reloaded).
 */
export function SidePane({
  title,
  actions,
  onClose,
  fullscreen = false,
  children,
}: {
  title: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  fullscreen?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Content.pane");
  const [width, setWidth] = useState(560);
  const start = useRef<{ x: number; width: number } | null>(null);
  const clamp = (value: number) => Math.min(1200, Math.max(320, value));
  return (
    <aside
      className={
        fullscreen
          ? "fixed inset-0 z-60 flex flex-col gap-2 bg-background px-3"
          : "relative hidden min-h-0 shrink-0 flex-col gap-2 border-l pl-3 lg:flex lg:w-(--pane-width)"
      }
      style={{ "--pane-width": `${width}px` } as React.CSSProperties}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t("resize")}
        aria-valuenow={width}
        aria-valuemin={320}
        aria-valuemax={1200}
        tabIndex={0}
        hidden={fullscreen}
        className="absolute top-0 -left-1.5 z-10 h-full w-3 cursor-col-resize focus-visible:bg-primary/20"
        onPointerDown={(event) => {
          start.current = { x: event.clientX, width };
          (event.target as HTMLElement).setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (start.current) setWidth(clamp(start.current.width + start.current.x - event.clientX));
        }}
        onPointerUp={() => (start.current = null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") setWidth((value) => clamp(value + 32));
          if (event.key === "ArrowRight") setWidth((value) => clamp(value - 32));
        }}
      />
      <div className="flex shrink-0 flex-wrap items-center gap-2 pt-2">
        <h2 className="m-0 min-w-0 flex-1 truncate text-base font-medium text-primary">{title}</h2>
        {actions}
        <Button type="button" size="icon-sm" variant="ghost" aria-label={t("close")} title={t("close")} onClick={onClose}>
          <XIcon aria-hidden />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col pb-2">{children}</div>
    </aside>
  );
}
