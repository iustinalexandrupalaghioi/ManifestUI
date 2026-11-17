"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { type Section } from "@/components/site/sections/model";
import type { PreviewMessage } from "@/components/site/sections/SectionsPreview";
import type { EditMessage } from "@/modules/site";
import { UI } from "./ui";

export const DEVICES = { desktop: 1280, phone: 390 } as const;

/** The page in a frame (/<locale>/site-preview), scaled to fit and fed the draft by postMessage. */
export function Canvas({
  locale,
  sections,
  selected,
  onEditorMessage,
  device,
  fill = false,
  errors,
  reveal,
  fixed = false,
}: {
  locale: string;
  sections: Section[];
  selected: string | null;
  /** Validation messages for the canvas: section id → content path → message. */
  errors: Record<string, Record<string, string>>;
  /** The header and footer: no section toolbar or "Add section" between them. */
  fixed?: boolean;
  /** Scrolls the frame to this section (bump `n` to repeat). */
  reveal: { id: string; n: number } | null;
  onEditorMessage: (message: EditMessage) => void;
  device: keyof typeof DEVICES;
  /** Full screen: take the remaining height of the overlay. */
  fill?: boolean;
}) {
  const uiLocale = useLocale();
  const ui = UI[uiLocale === "ro" ? "ro" : "en"];
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const handler = useRef(onEditorMessage);
  handler.current = onEditorMessage;
  // Bumped on every "ready" from the frame, so a reloaded frame gets the draft again.
  const [readyCount, setReadyCount] = useState(0);
  const [size, setSize] = useState({ width: 1000, height: 700 });

  const post = useCallback((message: PreviewMessage) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<PreviewMessage | EditMessage>) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.type === "manifestui:preview-ready") setReadyCount((count) => count + 1);
      else if (typeof data?.type === "string" && data.type.startsWith("manifestui:")) handler.current(data as EditMessage);
    };
    window.addEventListener("message", onMessage);
    // The frame may have loaded before this listener existed: ask it again.
    post({ type: "manifestui:ping" });
    return () => window.removeEventListener("message", onMessage);
  }, [post]);

  // Send the draft (debounced) whenever it changes or the frame (re)loads.
  useEffect(() => {
    if (readyCount === 0) return;
    const timer = setTimeout(() => post({ type: "manifestui:sections", sections, selected, locale: uiLocale, errors, fixed }), 100);
    return () => clearTimeout(timer);
  }, [readyCount, sections, selected, post, uiLocale, errors, fixed]);

  useEffect(() => {
    if (reveal) post({ type: "manifestui:select", id: reveal.id });
  }, [reveal, post]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Desktop fills the available width (scaled down below 1280px); phone stays 390px wide.
  const width = device === "desktop" ? Math.max(DEVICES.desktop, Math.round(size.width)) : DEVICES.phone;
  const scale = Math.min(1, size.width / width);

  return (
    // Fills the form page's viewport, so the page scrolls inside the frame and the CMS header stays put.
    <div
      ref={box}
      className={cn(
        "overflow-hidden rounded-lg border bg-muted/40",
        fill ? "min-h-0 flex-1" : "h-[calc(100dvh-12.5rem)] min-h-130",
      )}
    >
      <iframe
        ref={frame}
        title={ui.preview}
        src={`/${locale}/site-preview`}
        onLoad={() => post({ type: "manifestui:ping" })}
        className="block origin-top-left border-0 bg-background"
        style={{
          width,
          height: size.height / scale,
          transform: `scale(${scale})`,
          marginLeft: device === "phone" ? Math.max(0, (size.width - width * scale) / 2) : 0,
        }}
      />
    </div>
  );
}
