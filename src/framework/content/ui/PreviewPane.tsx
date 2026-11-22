"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Loader2Icon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import { CMS_SOURCE, readPreviewMessage, type CmsMessage } from "@/framework/preview/client";
import type { ContentOptions } from "../options";
import { frameNeedsReload, toFormName, toPreviewPath } from "../previewPaths";
import { useContentEditor } from "./context";
import { SidePane } from "./SidePane";

const DEBOUNCE_MS = 300;

/**
 * The live preview beside a record's tabs: the entry's real page in a frame,
 * in draft mode. With the preview helper on the page (`useLivePreview`), the
 * form's values go to it as the editor types (300 ms debounce), focusing a
 * field outlines it there and clicking a marked element opens its field
 * here. Without the helper, the frame reloads after each Save draft.
 */
export function PreviewPane({
  options,
  rowId,
  entryId,
  locale,
  version,
  onClose,
  onSelectField,
}: {
  options: ContentOptions;
  rowId: string;
  entryId: string;
  locale: string;
  /** The record's fetch time: the frame reloads when it changes and the page has no helper. */
  version: number;
  onClose: () => void;
  /** A marked element was clicked in the preview: open this form field. */
  onSelectField: (formName: string) => void;
}) {
  const t = useTranslations("Content.preview");
  const { actions } = useContentEditor();
  const form = useFormContext();
  const frame = useRef<HTMLIFrameElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const readyRef = useRef(false);
  readyRef.current = ready;

  const send = (message: CmsMessage) => frame.current?.contentWindow?.postMessage(message, window.location.origin);
  const sendDraft = () =>
    send({ source: CMS_SOURCE, type: "draft", entry: { type: options.type, entryId, locale, data: form.getValues() as Record<string, unknown> } });

  // The frame's address, signed on the server.
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setError(null);
    void actions.previewUrl(options.type, rowId).then((result) => {
      if (cancelled) return;
      if (result.ok) setUrl(result.data.url);
      else setError(result.error.message);
    });
    return () => {
      cancelled = true;
    };
  }, [actions, options.type, rowId]);

  // Messages from the frame: same origin and from this frame only.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const message = readPreviewMessage(event, window.location.origin);
      if (message?.type === "ready") {
        setReady(true);
        sendDraft();
      } else if (message?.type === "select") {
        onSelectField(toFormName(message.path, form.getValues()) ?? message.path);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, locale, onSelectField]);

  // The draft, as the editor types.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = form.watch(() => {
      if (!readyRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(sendDraft, DEBOUNCE_MS);
    });
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, entryId, locale]);

  // The field the editor focuses, outlined in the preview.
  useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      if (!readyRef.current) return;
      const editor = (event.target as Element | null)?.closest<HTMLElement>("[data-cms-field-editor]");
      const name = editor?.dataset.cmsFieldEditor;
      if (name) send({ source: CMS_SOURCE, type: "focus", path: toPreviewPath(name, form.getValues()) });
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // A new frame (or address) starts not ready: it says so when its page loads the helper.
  useEffect(() => setReady(false), [frameKey, url]);

  // Without the helper the page can't update live: reload it after each save.
  useEffect(() => {
    if (frameNeedsReload(readyRef.current)) setFrameKey((key) => key + 1);
  }, [version]);

  // Esc leaves full screen.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const segment = "h-7 rounded-none border-0 px-2.5 text-xs";
  return (
    <SidePane
      title={t("title")}
      onClose={onClose}
      fullscreen={fullscreen}
      actions={
        <>
          <div role="group" aria-label={t("title")} className="inline-flex overflow-hidden rounded-md border">
            {(["desktop", "phone"] as const).map((value) => (
              <Button key={value} type="button" variant={device === value ? "default" : "ghost"} className={segment} aria-pressed={device === value} onClick={() => setDevice(value)}>
                {t(value)}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-pressed={fullscreen}
            aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
            title={fullscreen ? `${t("exitFullscreen")} (Esc)` : t("fullscreen")}
            onClick={() => setFullscreen((value) => !value)}
          >
            {fullscreen ? <Minimize2Icon aria-hidden /> : <Maximize2Icon aria-hidden />}
          </Button>
        </>
      }
    >
      <p className="m-0 mb-1.5 shrink-0 text-xs text-muted-foreground">{ready ? t("live") : t("afterSave")}</p>
      <div className="flex min-h-0 flex-1 justify-center overflow-hidden rounded-md border bg-muted/30">
        {error ? (
          <p className="m-0 self-center p-4 text-center text-sm text-muted-foreground">{error}</p>
        ) : !url ? (
          <span className="flex items-center gap-2 self-center text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            {t("loading")}
          </span>
        ) : (
          <iframe
            key={frameKey}
            ref={frame}
            src={url}
            title={t("title")}
            className={cn("h-full border-0 bg-background", device === "phone" ? "w-[390px] max-w-full border-x" : "w-full")}
          />
        )}
      </div>
    </SidePane>
  );
}
