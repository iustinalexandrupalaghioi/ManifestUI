"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  BoldIcon,
  EyeIcon,
  FileTextIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PencilIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { defineFieldComponent } from "@/framework/extensions";
import { MarkdownPreview } from "./markdownPreview";

type Edit = (text: string, start: number, end: number) => { text: string; start: number; end: number };

/** Wraps the selection (or a placeholder) in `before` / `after`. */
const wrap =
  (before: string, after: string, placeholder: string): Edit =>
  (text, start, end) => {
    const selected = text.slice(start, end) || placeholder;
    const next = text.slice(0, start) + before + selected + after + text.slice(end);
    return { text: next, start: start + before.length, end: start + before.length + selected.length };
  };

/** Prefixes every selected line (headings, lists). */
const prefixLines =
  (prefix: (index: number) => string): Edit =>
  (text, start, end) => {
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = text.indexOf("\n", end) === -1 ? text.length : text.indexOf("\n", end);
    const block = text
      .slice(lineStart, lineEnd)
      .split("\n")
      .map((line, i) => prefix(i) + line.replace(/^(#{1,6} |[-*] |\d+\. )/, ""))
      .join("\n");
    return { text: text.slice(0, lineStart) + block + text.slice(lineEnd), start: lineStart, end: lineStart + block.length };
  };

const LABELS = {
  en: {
    write: "Write",
    preview: "Preview",
    h2: "Heading",
    h3: "Subheading",
    bold: "Bold",
    italic: "Italic",
    link: "Link",
    bullets: "Bulleted list",
    numbers: "Numbered list",
    toolbar: "Formatting",
    empty: "Nothing to preview yet.",
    hint: "Markdown: ## heading, **bold**, [link](https://…), - list item",
  },
  ro: {
    write: "Scrie",
    preview: "Previzualizare",
    h2: "Titlu",
    h3: "Subtitlu",
    bold: "Îngroșat",
    italic: "Cursiv",
    link: "Legătură",
    bullets: "Listă cu puncte",
    numbers: "Listă numerotată",
    toolbar: "Formatare",
    empty: "Nimic de previzualizat încă.",
    hint: "Markdown: ## titlu, **îngroșat**, [legătură](https://…), - element de listă",
  },
};

/**
 * Markdown body editor with a formatting toolbar and a live preview that uses
 * the renderer the project registers (setMarkdownRenderer), so it matches the page.
 * Side by side on wide screens; Write / Preview tabs on narrow ones.
 */
export const markdownField = defineFieldComponent({
  type: "markdown",
  label: { en: "Markdown editor", ro: "Editor Markdown" },
  icon: FileTextIcon,
  props: z.object({
    height: z.number().int().min(200).max(1200).default(560).describe("Editor height in pixels"),
  }),
  component: ({ id, value, onChange, onBlur, disabled, readOnly, props }) => {
    const locale = useLocale();
    const l = LABELS[locale === "ro" ? "ro" : "en"];
    const text = typeof value === "string" ? value : "";
    const locked = disabled || readOnly;
    const [tab, setTab] = useState<"write" | "preview">("write");
    const area = useRef<HTMLTextAreaElement>(null);

    const apply = (edit: Edit) => {
      const el = area.current;
      if (!el || locked) return;
      const result = edit(text, el.selectionStart, el.selectionEnd);
      onChange(result.text);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(result.start, result.end);
      });
    };

    const tools: { label: string; icon: ReactNode; edit: Edit }[] = [
      { label: l.h2, icon: <Heading2Icon />, edit: prefixLines(() => "## ") },
      { label: l.h3, icon: <Heading3Icon />, edit: prefixLines(() => "### ") },
      { label: l.bold, icon: <BoldIcon />, edit: wrap("**", "**", l.bold) },
      { label: l.italic, icon: <ItalicIcon />, edit: wrap("*", "*", l.italic) },
      { label: l.link, icon: <LinkIcon />, edit: wrap("[", "](https://)", l.link) },
      { label: l.bullets, icon: <ListIcon />, edit: prefixLines(() => "- ") },
      { label: l.numbers, icon: <ListOrderedIcon />, edit: prefixLines((i) => `${i + 1}. `) },
    ];

    const tabButton = (key: "write" | "preview", label: string, icon: ReactNode) => (
      <button
        type="button"
        aria-pressed={tab === key}
        onClick={() => setTab(key)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium lg:hidden [&_svg]:size-4",
          tab === key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {icon}
        {label}
      </button>
    );

    return (
      <div className="flex flex-col overflow-hidden rounded-lg border" onBlur={onBlur}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-2 py-1.5">
          <div role="toolbar" aria-label={l.toolbar} className="flex flex-wrap items-center gap-0.5">
            {tools.map((tool) => (
              <button
                key={tool.label}
                type="button"
                title={tool.label}
                aria-label={tool.label}
                disabled={locked}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => apply(tool.edit)}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50 [&_svg]:size-4"
              >
                {tool.icon}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 lg:hidden">
            {tabButton("write", l.write, <PencilIcon />)}
            {tabButton("preview", l.preview, <EyeIcon />)}
          </div>
        </div>
        <div className="grid lg:grid-cols-2" style={{ height: props.height }}>
          <textarea
            ref={area}
            id={id}
            value={text}
            onChange={(event) => onChange(event.target.value)}
            readOnly={locked}
            spellCheck
            aria-describedby={`${id}-hint`}
            className={cn(
              "h-full resize-none bg-background p-4 font-mono text-sm leading-6 outline-none",
              tab === "preview" && "max-lg:hidden",
            )}
          />
          <div
            aria-label={l.preview}
            role="region"
            tabIndex={0}
            className={cn(
              "h-full overflow-y-auto border-l bg-background px-6 py-2 max-lg:border-l-0",
              tab === "write" && "max-lg:hidden",
            )}
          >
            {text.trim() ? (
              <MarkdownPreview source={text} />
            ) : (
              <p className="py-6 text-sm text-muted-foreground">{l.empty}</p>
            )}
          </div>
        </div>
        <p id={`${id}-hint`} className="m-0 border-t bg-muted/40 px-3 py-1.5 font-mono text-xs text-muted-foreground">
          {l.hint}
        </p>
      </div>
    );
  },
});
