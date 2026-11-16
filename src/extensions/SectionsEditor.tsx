"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircleIcon, Loader2Icon, LayoutTemplateIcon, Maximize2Icon, Minimize2Icon, MonitorIcon, PlusIcon, SaveIcon, SmartphoneIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useFormState, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { defineBlockComponent } from "@/framework/extensions";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { ConfirmDialog } from "@/framework/components/dialog/ConfirmDialog";
import { useOptionalFormPage } from "@/framework/components/page/FormPage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  blankListItem,
  describeContentPath,
  emptySection,
  parseSections,
  SECTION_TYPES,
  sectionLabel,
  type Section,
  type SectionType,
} from "@/components/site/sections/model";
import type { PreviewMessage } from "@/components/site/sections/SectionsPreview";
import { parseSiteSettings, SITE_SETTINGS_PARTS } from "@/components/site/settings/model";
import type { EditMessage } from "@/components/site/sections/editable";

const UI = {
  en: {
    hint: "Edit the page directly: click any text to change it, use the buttons on images to replace them, + and × to add or remove items, and the toolbar that appears on a section to move, hide or remove it. Save the page to publish.",
    settingsHint: "Edit the header and footer directly: click any text to change it, the Link notes under links to change where they go, and + and × to add or remove links and columns. Save to update every page of the site.",
    locked: "This page is read-only for you. Ask an administrator for edit permission on Site pages.",
    add: "Add section",
    desktop: "Desktop",
    phone: "Phone",
    preview: "Page editor",
    removeTitle: "Remove this section?",
    removeBody: "The section and its texts are removed from this page when you save. To keep it but not show it, hide it instead.",
    removeConfirm: "Remove section",
    cancel: "Cancel",
    fullscreen: "Full screen",
    exitFullscreen: "Exit full screen (Esc)",
    save: "Save",
    saving: "Saving…",
    unsaved: "Unsaved changes",
    problems: (n: number) => (n === 1 ? "This page has 1 problem to fix before it can be saved:" : `This page has ${n} problems to fix before it can be saved:`),
  },
  ro: {
    hint: "Editezi pagina direct: dă clic pe orice text ca să-l schimbi, folosește butoanele de pe imagini ca să le înlocuiești, + și × ca să adaugi sau să elimini elemente și bara care apare pe o secțiune ca s-o muți, s-o ascunzi sau s-o elimini. Salvează pagina ca s-o publici.",
    settingsHint: "Editezi antetul și subsolul direct: dă clic pe orice text ca să-l schimbi, pe notele Legătură de sub legături ca să schimbi unde duc și pe + și × ca să adaugi sau să elimini legături și coloane. Salvează ca să actualizezi toate paginile site-ului.",
    locked: "Această pagină este doar pentru citire pentru tine. Cere unui administrator permisiunea de editare pentru Pagini de site.",
    add: "Adaugă o secțiune",
    desktop: "Desktop",
    phone: "Telefon",
    preview: "Editorul paginii",
    removeTitle: "Elimini această secțiune?",
    removeBody: "Secțiunea și textele ei sunt eliminate din pagină când salvezi. Ca s-o păstrezi fără s-o afișezi, ascunde-o.",
    removeConfirm: "Elimină secțiunea",
    cancel: "Renunță",
    fullscreen: "Ecran complet",
    exitFullscreen: "Ieși din ecranul complet (Esc)",
    save: "Salvează",
    saving: "Se salvează…",
    unsaved: "Modificări nesalvate",
    problems: (n: number) => (n === 1 ? "Pagina are o problemă de rezolvat înainte de salvare:" : `Pagina are ${n} probleme de rezolvat înainte de salvare:`),
  },
};

/** Immutably sets a dotted path ("demo.1.image") inside section content. */
function setAtPath(target: unknown, path: string[], value: unknown): unknown {
  if (!path.length) return value;
  const [key, ...rest] = path;
  if (Array.isArray(target)) {
    const next = [...target];
    next[Number(key)] = setAtPath(next[Number(key)], rest, value);
    return next;
  }
  const obj = (target ?? {}) as Record<string, unknown>;
  return { ...obj, [key]: setAtPath(obj[key], rest, value) };
}

const DEVICES = { desktop: 1280, phone: 390 } as const;

interface SectionProblem {
  /** Path from the sections array: [index, "content", ...]. */
  path: (string | number)[];
  message: string;
}

/** Flattens react-hook-form errors under `sections` into path + message pairs. */
function collectProblems(node: unknown, path: (string | number)[] = [], out: SectionProblem[] = []): SectionProblem[] {
  if (!node || typeof node !== "object") return out;
  const record = node as Record<string, unknown>;
  if (typeof record.message === "string" && record.message && "type" in record) out.push({ path, message: record.message });
  for (const [key, child] of Object.entries(record)) {
    if (key === "ref" || key === "message" || key === "type" || key === "types") continue;
    collectProblems(child, key === "root" ? path : [...path, /^d+$/.test(key) ? Number(key) : key], out);
  }
  return out;
}

/** The page in a frame (/<locale>/site-preview), scaled to fit and fed the draft by postMessage. */
function Canvas({
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

/** Site settings ({ header, footer }) as the editor's fixed list of sections, and back. */
const settingsToSections = (value: unknown) => {
  const settings = parseSiteSettings(value);
  return SITE_SETTINGS_PARTS.map(({ id, def }) => ({ id, type: def.type, content: settings[id] })) as unknown as Section[];
};
const sectionsToSettings = (sections: Section[]) =>
  Object.fromEntries(SITE_SETTINGS_PARTS.map(({ id }) => [id, sections.find((s) => s.id === id)?.content ?? {}]));

/**
 * Editor for a "sections" site page, WordPress-style: the page itself is the
 * editor. Texts are edited in place, images replaced in place, list items
 * added and removed in place, and sections moved, hidden, shown, added and
 * removed from the canvas. Changes go into the page form; saving publishes.
 *
 * `mode: "settings"` edits the site's header and footer (the form's
 * `content` field) the same way, as two fixed parts that can't be added,
 * moved or removed.
 */
export const sectionsEditor = defineBlockComponent({
  type: "sectionsEditor",
  label: { en: "Page editor", ro: "Editorul paginii" },
  icon: LayoutTemplateIcon,
  props: z.object({ mode: z.enum(["page", "settings"]).default("page") }),
  component: function SectionsEditor({ values, form, disabled, readOnly, props }) {
    const locale = useLocale();
    const ui = UI[locale === "ro" ? "ro" : "en"];
    const locked = disabled || readOnly;
    const settingsMode = props.mode === "settings";
    const field = settingsMode ? "content" : "sections";
    const toSections = (value: unknown) => (settingsMode ? settingsToSections(value) : parseSections(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const sections = useMemo(() => toSections(values[field]), [values[field], settingsMode]);
    const pageLocale = values.locale === "ro" ? "ro" : "en";
    const [selected, setSelected] = useState<string | null>(null);
    const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
    const [pendingRemove, setPendingRemove] = useState<string | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const formPage = useOptionalFormPage();
    const [reveal, setReveal] = useState<{ id: string; n: number } | null>(null);

    // Validation runs in the form (and again on the server); show its messages here and on the canvas.
    const { errors: formErrors } = useFormState({ control: form.control, name: field });
    const rawSections: unknown[] = Array.isArray(values.sections) ? values.sections : [];
    const problems = collectProblems((formErrors as FieldErrors<Record<string, unknown>>)[field]).map((problem) => {
      if (settingsMode) {
        // Paths start with the part: ["footer", "columns", 0, "title"].
        const part = SITE_SETTINGS_PARTS.find((p) => p.id === problem.path[0]);
        const contentPath = problem.path.slice(1);
        const where = part ? describeContentPath(part.def.type, contentPath, locale) : problem.path.join(" › ");
        return { ...problem, id: part?.id ?? null, contentPath: contentPath.join("."), where };
      }
      const index = typeof problem.path[0] === "number" ? problem.path[0] : -1;
      const raw = (rawSections[index] ?? {}) as { id?: unknown; type?: unknown };
      const id = typeof raw.id === "string" ? raw.id : null;
      const type = typeof raw.type === "string" ? raw.type : "";
      const inContent = problem.path[1] === "content";
      const contentPath = inContent ? problem.path.slice(2) : [];
      const where = inContent ? describeContentPath(type, contentPath, locale) : [type || `#${index + 1}`, ...problem.path.slice(1)].join(" › ");
      return { ...problem, id, contentPath: contentPath.join("."), where };
    });
    const errorsByPath: Record<string, Record<string, string>> = {};
    for (const problem of problems) if (problem.id) (errorsByPath[problem.id] ??= {})[problem.contentPath] = problem.message;
    // Stable while the messages don't change, so the canvas isn't re-sent the draft on every render.
    const errorsKey = JSON.stringify(errorsByPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const canvasErrors = useMemo(() => errorsByPath, [errorsKey]);

    // Esc leaves full screen (unless a dialog or menu is handling it).
    useEffect(() => {
      if (!fullscreen) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !event.defaultPrevented && !document.querySelector("[role=dialog],[role=menu]")) setFullscreen(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [fullscreen]);

    /** Always works on the latest form value, so quick typing never uses a stale draft. */
    const latest = () => toSections(form.getValues(field));
    const commit = (next: Section[]) =>
      form.setValue(field, settingsMode ? sectionsToSettings(next) : next, { shouldDirty: true, shouldTouch: true, shouldValidate: true });

    const addSection = (type: SectionType, afterId: string | null) => {
      const current = latest();
      const section = emptySection(type, pageLocale);
      const at = afterId === null ? 0 : current.findIndex((s) => s.id === afterId) + 1;
      commit([...current.slice(0, at), section, ...current.slice(at)]);
      setSelected(section.id);
    };

    const onEditorMessage = (message: EditMessage) => {
      if (message.type === "manifestui:selected") {
        setSelected(message.id);
        return;
      }
      if (locked) return;
      // The header and footer are fixed: no adding, moving, hiding or removing.
      if (settingsMode && (message.type === "manifestui:add-section" || message.type === "manifestui:section-action")) return;
      if (message.type === "manifestui:add-section") {
        addSection(message.sectionType, message.afterId);
        return;
      }
      const current = latest();
      const index = current.findIndex((section) => section.id === message.sectionId);
      if (index < 0) return;
      const section = current[index];
      const replace = (next: Section) => commit(current.map((s, i) => (i === index ? next : s)));

      if (message.type === "manifestui:edit") {
        replace({ ...section, content: setAtPath(section.content, message.path.split("."), message.value) } as Section);
        return;
      }
      if (message.type === "manifestui:list") {
        const path = message.path.split(".");
        const list = path.reduce<unknown>((value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]), section.content);
        const items = Array.isArray(list) ? [...list] : [];
        if (message.op === "add") {
          const blank = blankListItem(section.type, message.path);
          if (blank === null) return;
          items.push(blank);
        } else if (message.index !== undefined) {
          items.splice(message.index, 1);
        }
        replace({ ...section, content: setAtPath(section.content, path, items) } as Section);
        return;
      }
      // Section toolbar
      const next = [...current];
      if (message.action === "up" && index > 0) [next[index - 1], next[index]] = [next[index], next[index - 1]];
      else if (message.action === "down" && index < next.length - 1) [next[index + 1], next[index]] = [next[index], next[index + 1]];
      else if (message.action === "hide") next[index] = { ...section, hidden: true };
      else if (message.action === "show") next[index] = { ...section, hidden: false };
      else if (message.action === "remove") {
        setPendingRemove(section.id);
        return;
      }
      commit(next);
    };

    const editor = (
      <div
        className={cn(
          "flex min-w-0 flex-col gap-2",
          fullscreen && "fixed inset-0 z-50 bg-background p-3",
        )}
        role={fullscreen ? "region" : undefined}
        aria-label={fullscreen ? ui.preview : undefined}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 min-w-0 flex-1 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            {locked ? ui.locked : settingsMode ? ui.settingsHint : ui.hint}
          </p>
          <div className="flex items-center gap-2">
            {!settingsMode && (
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={locked}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <PlusIcon className="size-4" aria-hidden />
                {ui.add}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {SECTION_TYPES.map((type) => (
                  <DropdownMenuItem key={type} onSelect={() => addSection(type, sections.at(-1)?.id ?? null)}>
                    {resolveLabel(sectionLabel(type), locale)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            )}
            {fullscreen && formPage && !formPage.readOnly && (
              <span className="flex items-center gap-2">
                {formPage.isDirty && <span className="text-xs text-muted-foreground">{ui.unsaved}</span>}
                <button
                  type="button"
                  onClick={() => formPage.onSave()}
                  disabled={!formPage.isDirty || formPage.isSaving || !formPage.canSave}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {formPage.isSaving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
                  {formPage.isSaving ? ui.saving : ui.save}
                </button>
              </span>
            )}
            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
              {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={device === key}
                  onClick={() => setDevice(key)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium [&_svg]:size-3.5",
                    device === key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground",
                  )}
                >
                  {key === "desktop" ? <MonitorIcon /> : <SmartphoneIcon />}
                  {ui[key]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setFullscreen((value) => !value)}
              aria-pressed={fullscreen}
              title={fullscreen ? ui.exitFullscreen : ui.fullscreen}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted"
            >
              {fullscreen ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}
              <span className="max-sm:sr-only">{fullscreen ? ui.exitFullscreen.replace(/ (Esc)$/, "") : ui.fullscreen}</span>
            </button>
          </div>
        </div>

        {problems.length > 0 && (
          <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
            <p className="m-0 flex items-center gap-2 font-medium text-destructive">
              <AlertCircleIcon className="size-4 shrink-0" aria-hidden />
              {ui.problems(problems.length)}
            </p>
            <ul className="m-0 mt-1.5 flex max-h-32 list-none flex-col gap-0.5 overflow-y-auto p-0">
              {problems.map((problem, index) => (
                <li key={index}>
                  <button
                    type="button"
                    disabled={!problem.id}
                    onClick={() => {
                      if (!problem.id) return;
                      setSelected(problem.id);
                      setReveal((current) => ({ id: problem.id!, n: (current?.n ?? 0) + 1 }));
                    }}
                    className="rounded-sm text-left hover:underline disabled:no-underline"
                  >
                    <span className="font-medium">{problem.where}</span>
                    <span className="text-muted-foreground">: {problem.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Canvas
          locale={pageLocale}
          sections={sections}
          selected={selected}
          errors={canvasErrors}
          reveal={reveal}
          fixed={settingsMode}
          onEditorMessage={onEditorMessage}
          device={device}
          fill={fullscreen}
        />

        <ConfirmDialog
          open={pendingRemove !== null}
          setOpen={(open) => !open && setPendingRemove(null)}
          title={ui.removeTitle}
          description={ui.removeBody}
          confirmLabel={ui.removeConfirm}
          cancelLabel={ui.cancel}
          variant="destructive"
          onConfirm={() => {
            if (pendingRemove) commit(latest().filter((s) => s.id !== pendingRemove));
            setPendingRemove(null);
          }}
        />
      </div>
    );

    // Full screen renders at the end of <body>, above the CMS header; dialogs and menus opened later still stack on top.
    return fullscreen ? createPortal(editor, document.body) : editor;
  },
});
