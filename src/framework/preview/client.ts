"use client";

/**
 * Live preview for frontends: the CMS loads the entry's page in a frame and
 * sends the draft as the editor types. Self-contained (React only, nothing
 * else from the framework), so it can be published as a package.
 *
 *   const page = useLivePreview(initialPage, { type: "page", entryId, map: (data) => toPage(data) });
 *   <h1 {...cmsField("title")}>{page.title}</h1>
 *   useEffect(() => enablePreviewSelect(), []);
 *
 * Messages (window.postMessage, same origin only, checked on both sides):
 *   frame → CMS  { source: "manifest-preview", type: "ready" }
 *   CMS → frame  { source: "manifest-cms", type: "draft", entry: { type, entryId, locale, data } }
 *   CMS → frame  { source: "manifest-cms", type: "focus", path }
 *   frame → CMS  { source: "manifest-preview", type: "select", path }
 *
 * Paths: "title", or inside a blocks field "body[b_x7k2].items.0.question"
 * (the block's id, so a path survives reordering).
 */
import { useEffect, useState } from "react";

export const CMS_SOURCE = "manifest-cms";
export const PREVIEW_SOURCE = "manifest-preview";

export interface PreviewEntry {
  type: string;
  entryId: string;
  locale: string;
  data: Record<string, unknown>;
}

export type CmsMessage = { source: typeof CMS_SOURCE; type: "draft"; entry: PreviewEntry } | { source: typeof CMS_SOURCE; type: "focus"; path: string };
export type PreviewMessage = { source: typeof PREVIEW_SOURCE; type: "ready" } | { source: typeof PREVIEW_SOURCE; type: "select"; path: string };

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

/** A message from the CMS, or null when it comes from another origin or isn't one. */
export function readCmsMessage(event: { origin: string; data: unknown }, expectedOrigin: string): CmsMessage | null {
  if (event.origin !== expectedOrigin || !isRecord(event.data) || event.data.source !== CMS_SOURCE) return null;
  const message = event.data;
  if (message.type === "focus" && typeof message.path === "string") return { source: CMS_SOURCE, type: "focus", path: message.path };
  if (message.type === "draft" && isRecord(message.entry)) {
    const entry = message.entry;
    if (typeof entry.type === "string" && typeof entry.entryId === "string" && typeof entry.locale === "string" && isRecord(entry.data))
      return { source: CMS_SOURCE, type: "draft", entry: { type: entry.type, entryId: entry.entryId, locale: entry.locale, data: entry.data } };
  }
  return null;
}

/** A message from the preview frame, or null when it comes from another origin or isn't one. */
export function readPreviewMessage(event: { origin: string; data: unknown }, expectedOrigin: string): PreviewMessage | null {
  if (event.origin !== expectedOrigin || !isRecord(event.data) || event.data.source !== PREVIEW_SOURCE) return null;
  if (event.data.type === "ready") return { source: PREVIEW_SOURCE, type: "ready" };
  if (event.data.type === "select" && typeof event.data.path === "string") return { source: PREVIEW_SOURCE, type: "select", path: event.data.path };
  return null;
}

/** True when this page runs inside another window's frame (the CMS preview pane). */
export function isInPreviewFrame(win: { parent: unknown } | undefined = typeof window === "undefined" ? undefined : window): boolean {
  return !!win && win.parent !== win;
}

/** Whether a draft is for the entry this page shows (any entry when `match` names none). */
export function draftMatches(entry: PreviewEntry, match: { type?: string; entryId?: string; locale?: string }): boolean {
  return (!match.type || entry.type === match.type) && (!match.entryId || entry.entryId === match.entryId) && (!match.locale || entry.locale === match.locale);
}

function post(message: PreviewMessage) {
  window.parent.postMessage(message, window.location.origin);
}

/**
 * The live draft while this page runs in the CMS preview frame, else
 * `initialData`. `map` turns the draft's raw fields into what the page
 * renders (parse blocks, pick fields…).
 */
export function useLivePreview<T>(
  initialData: T,
  options: { type?: string; entryId?: string; locale?: string; map?: (data: Record<string, unknown>) => T } = {},
): T {
  const [data, setData] = useState(initialData);
  const { type, entryId, locale, map } = options;
  useEffect(() => setData(initialData), [initialData]);
  useEffect(() => {
    if (!isInPreviewFrame()) return;
    const onMessage = (event: MessageEvent) => {
      const message = readCmsMessage(event, window.location.origin);
      if (message?.type !== "draft" || !draftMatches(message.entry, { type, entryId, locale })) return;
      setData(map ? map(message.entry.data) : (message.entry.data as T));
    };
    window.addEventListener("message", onMessage);
    post({ source: PREVIEW_SOURCE, type: "ready" });
    return () => window.removeEventListener("message", onMessage);
    // `map` is read when a draft arrives; a new function each render shouldn't re-subscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, entryId, locale]);
  return data;
}

/** Marks an element as showing a field, so clicking it in the preview opens that field in the CMS. */
export function cmsField(path: string): { "data-cms-field": string } {
  return { "data-cms-field": path };
}

const OUTLINE = "2px solid #1f8ea0";

/**
 * In the preview frame: a click on a marked element selects its field in the
 * CMS (and doesn't follow links); a field focused in the CMS is scrolled to
 * and outlined here. Returns a cleanup function.
 */
export function enablePreviewSelect(): () => void {
  if (!isInPreviewFrame()) return () => {};
  let outlined: HTMLElement | null = null;
  const clearOutline = () => {
    if (outlined) {
      outlined.style.outline = "";
      outlined.style.outlineOffset = "";
    }
    outlined = null;
  };
  const onClick = (event: MouseEvent) => {
    const marked = (event.target as Element | null)?.closest<HTMLElement>("[data-cms-field]");
    if (!marked) return;
    event.preventDefault();
    event.stopPropagation();
    post({ source: PREVIEW_SOURCE, type: "select", path: marked.dataset.cmsField! });
  };
  const onMessage = (event: MessageEvent) => {
    const message = readCmsMessage(event, window.location.origin);
    if (message?.type !== "focus") return;
    clearOutline();
    const element = document.querySelector<HTMLElement>(`[data-cms-field="${CSS.escape(message.path)}"]`);
    if (!element) return;
    element.style.outline = OUTLINE;
    element.style.outlineOffset = "3px";
    outlined = element;
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  const style = document.createElement("style");
  style.textContent = "[data-cms-field]{cursor:pointer}[data-cms-field]:hover{outline:1px dashed #1f8ea0;outline-offset:3px}";
  document.head.appendChild(style);
  document.addEventListener("click", onClick, true);
  window.addEventListener("message", onMessage);
  return () => {
    clearOutline();
    style.remove();
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("message", onMessage);
  };
}
