"use client";

import { useRef, useState } from "react";
import { ImageIcon, ImageUpIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useLocale } from "next-intl";
import { z } from "zod";
import { defineFieldComponent } from "@/framework/extensions";
import { uploadSiteMedia } from "@/components/site/internal/media/upload";
import { MEDIA_TYPES } from "@/framework/site";

const TEXT = {
  en: { upload: "Upload image", replace: "Replace", remove: "Remove", empty: "No image", failed: "Upload failed", forbidden: "No permission to upload" },
  ro: { upload: "Încarcă o imagine", replace: "Înlocuiește", remove: "Elimină", empty: "Nicio imagine", failed: "Încărcarea a eșuat", forbidden: "Fără permisiune de încărcare" },
};

type Media = { src: string; width: number; height: number };
const EMPTY: Media = { src: "", width: 0, height: 0 };

/**
 * A public website image ({ src, width, height }) for a resource field, e.g.
 * a collection item's picture. Uploads to the public site-media bucket, so the
 * static website can show it; `resource` lets that resource's editors upload.
 */
export const siteImageField = defineFieldComponent({
  type: "siteImage",
  label: { en: "Website image", ro: "Imagine pentru site" },
  icon: ImageIcon,
  props: z.object({
    resource: z.string().default("").describe("Resource id whose editors may upload (e.g. services)"),
  }),
  component: function SiteImageField({ value, onChange, disabled, readOnly, props }) {
    const text = TEXT[useLocale() === "ro" ? "ro" : "en"];
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const media: Media = value && typeof value === "object" && "src" in value ? (value as Media) : EMPTY;
    const locked = disabled || readOnly;

    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex aspect-video w-48 items-center justify-center overflow-hidden rounded-md border bg-muted text-xs text-muted-foreground">
          {media.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.src} alt="" className="h-full w-full object-cover" />
          ) : (
            text.empty
          )}
        </div>
        {!locked && (
          <div className="flex flex-col gap-2">
            <input
              ref={input}
              type="file"
              accept={MEDIA_TYPES.image.accept}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setBusy(true);
                setError("");
                try {
                  onChange(await uploadSiteMedia(file, "image", { resource: props.resource || undefined }));
                } catch (err) {
                  setError(err instanceof Error && err.message === "forbidden" ? text.forbidden : text.failed);
                } finally {
                  setBusy(false);
                }
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => input.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              {busy ? <Loader2Icon className="size-4 animate-spin" /> : <ImageUpIcon className="size-4" />}
              {media.src ? text.replace : text.upload}
            </button>
            {media.src && (
              <button
                type="button"
                onClick={() => onChange(EMPTY)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2Icon className="size-4" />
                {text.remove}
              </button>
            )}
            {error && <p className="m-0 text-xs text-destructive">{error}</p>}
          </div>
        )}
      </div>
    );
  },
});
