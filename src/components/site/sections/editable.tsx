"use client";

/**
 * Inline editing inside the CMS preview frame (WordPress-style): texts become
 * editable in place, images get Replace/Remove buttons, lists get add/remove
 * controls. Every change is posted to the editor (the parent window), which
 * updates the page form; saving the page publishes it. Used only when
 * sections render with `edit` on.
 */
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ImageUpIcon, Loader2Icon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadSiteMedia } from "../media/upload";
import { MEDIA_TYPES, type MediaKind } from "../media/types";
import type { SectionType } from "./model";

export type EditMessage =
  | { type: "manifestui:edit"; sectionId: string; path: string; value: unknown }
  | { type: "manifestui:list"; sectionId: string; path: string; op: "add" | "remove"; index?: number }
  | { type: "manifestui:section-action"; sectionId: string; action: "up" | "down" | "hide" | "show" | "remove" }
  | { type: "manifestui:add-section"; afterId: string | null; sectionType: SectionType }
  | { type: "manifestui:selected"; id: string };

export const postToEditor = (message: EditMessage) =>
  window.parent?.postMessage(message, window.location.origin);

const EMPTY_MEDIA = { src: "", width: 0, height: 0 };

/**
 * An editable text. It renders no React children: the DOM text is set from
 * `value` only while the element isn't focused, so typing never loses the
 * caret when the editor sends the updated draft back.
 */
export function EditableText({
  sectionId,
  path,
  value,
  multiline = false,
  placeholder = "…",
  error,
}: {
  sectionId: string;
  path: string;
  value: string;
  multiline?: boolean;
  placeholder?: string;
  /** Validation message: outlines the text in red, with the message as its tooltip. */
  error?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value;
  }, [value]);

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    // Keep Space/Enter from toggling <summary> or activating links/buttons around the text.
    event.stopPropagation();
    if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") event.currentTarget.blur();
  };

  return (
    <span
      ref={ref}
      role="textbox"
      aria-label={path}
      aria-multiline={multiline}
      aria-invalid={error ? true : undefined}
      title={error}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      onKeyDown={onKeyDown}
      onKeyUp={(event) => event.stopPropagation()}
      onClick={(event) => {
        // Don't follow links, switch tabs or toggle details while editing.
        event.preventDefault();
        event.stopPropagation();
      }}
      onInput={(event) =>
        postToEditor({ type: "manifestui:edit", sectionId, path, value: event.currentTarget.innerText.replace(/\n$/, "") })
      }
      onPaste={(event) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, multiline ? text : text.replace(/\s*\n\s*/g, " "));
      }}
      className={cn(
        "min-w-[1ch] cursor-text rounded-[3px] whitespace-pre-wrap outline-offset-2",
        "hover:outline-1 hover:outline-[#22A6C4] hover:outline-dashed focus:outline-2 focus:outline-[#22A6C4] focus:outline-solid",
        "empty:before:text-current/40 empty:before:content-[attr(data-placeholder)]",
        error && "outline-2 outline-red-500 outline-solid hover:outline-red-500 hover:outline-solid focus:outline-red-500",
      )}
    />
  );
}

/** A small labelled editable line, for texts that aren't visible on the page (image descriptions…). */
export function EditableNote({
  sectionId,
  path,
  value,
  label,
  className,
}: {
  sectionId: string;
  path: string;
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-baseline gap-2 rounded-md border border-dashed border-[#22A6C4]/60 bg-[#22A6C4]/10 px-2 py-1 text-left text-xs", className)}>
      <span className="shrink-0 font-semibold text-[#22A6C4]">{label}</span>
      <span className="min-w-0 flex-1 text-current/90">
        <EditableText sectionId={sectionId} path={path} value={value} multiline />
      </span>
    </span>
  );
}

/** "×" on a list item: removes it. */
export function ItemRemove({
  sectionId,
  path,
  index,
  label = "Remove item",
  className,
}: {
  sectionId: string;
  path: string;
  index: number;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        postToEditor({ type: "manifestui:list", sectionId, path, op: "remove", index });
      }}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0E7490] text-white shadow hover:bg-red-600 [&_svg]:size-3.5",
        className,
      )}
    >
      <XIcon />
    </button>
  );
}

/** "+ Add …" after a list: appends an empty item. */
export function ListAdd({ sectionId, path, label, className }: { sectionId: string; path: string; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        postToEditor({ type: "manifestui:list", sectionId, path, op: "add" });
      }}
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#22A6C4]/70 px-3 text-sm font-semibold text-[#22A6C4] hover:bg-[#22A6C4]/10 [&_svg]:size-4",
        className,
      )}
    >
      <PlusIcon />
      {label}
    </button>
  );
}

/** Replace (and optionally remove) an image, video or captions file, in place. */
export function MediaReplaceButton({
  sectionId,
  path,
  accept = "image",
  label,
  removable = false,
  className,
}: {
  sectionId: string;
  path: string;
  accept?: MediaKind;
  label: string;
  removable?: boolean;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className={cn("absolute top-3 right-3 z-20 flex flex-col items-end gap-1", className)}>
      <input
        ref={input}
        type="file"
        accept={MEDIA_TYPES[accept].accept}
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
            postToEditor({ type: "manifestui:edit", sectionId, path, value: await uploadSiteMedia(file, accept) });
          } catch (err) {
            setError(err instanceof Error && err.message === "forbidden" ? "No permission to upload" : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
      <span className="flex gap-1">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            input.current?.click();
          }}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#22A6C4] px-3 text-sm font-semibold text-[#04232C] shadow-lg hover:bg-[#3BB7D3] disabled:opacity-70"
        >
          {busy ? <Loader2Icon className="size-4 animate-spin" /> : <ImageUpIcon className="size-4" />}
          {label}
        </button>
        {removable && (
          <button
            type="button"
            aria-label="Remove"
            title="Remove"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              postToEditor({ type: "manifestui:edit", sectionId, path, value: EMPTY_MEDIA });
            }}
            className="inline-flex size-9 items-center justify-center rounded-lg bg-[#0B1418]/85 text-white shadow-lg hover:bg-red-600 [&_svg]:size-4"
          >
            <Trash2Icon />
          </button>
        )}
      </span>
      {error && <span className="rounded bg-red-600 px-2 py-0.5 text-xs text-white">{error}</span>}
    </div>
  );
}
