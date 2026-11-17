"use client";

import { useEffect, useMemo, useState } from "react";
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
import { SITE_SETTINGS_PARTS } from "@/components/site/settings/model";
import type { EditMessage } from "@/modules/site";
import { UI } from "./sectionsEditor/ui";
import { setAtPath, collectProblems, settingsToSections, sectionsToSettings } from "./sectionsEditor/content";
import { DEVICES, Canvas } from "./sectionsEditor/PreviewCanvas";

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
        // The frame sends a plain string: only add types that are registered.
        const type = SECTION_TYPES.find((known) => known === message.sectionType);
        if (type) addSection(type, message.afterId);
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
