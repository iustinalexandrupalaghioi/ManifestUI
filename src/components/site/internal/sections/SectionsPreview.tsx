"use client";

import { useEffect, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeOffIcon, PlusIcon, SlidersHorizontalIcon, Trash2Icon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { uploadSiteMedia } from "../media/upload";
import { parseSections, SECTION_TYPES, sectionLabel, type Section } from "./model";
import { getSection, postToEditor, RenderSections, settingFields, SiteEditorProvider } from "@/modules/site";

/** Messages exchanged with the CMS section editor (same origin only). */
export type PreviewMessage =
  | { type: "manifestui:preview-ready" }
  /** From the editor: "are you there?" (the frame may load before the editor listens). */
  | { type: "manifestui:ping" }
  | {
      type: "manifestui:sections";
      sections: unknown;
      selected?: string | null;
      locale?: string;
      /** Site settings: render the header and footer only, without section controls. */
      fixed?: boolean;
      /** Validation messages: section id → content path → message. */
      errors?: Record<string, Record<string, string>>;
    }
  | { type: "manifestui:select"; id: string | null };

const UI = {
  en: { up: "Move up", down: "Move down", hide: "Hide on the site", show: "Show", remove: "Remove section", hidden: "Hidden on the site", add: "Add section here", settings: "Section settings", problems: (n: number) => (n === 1 ? "1 problem" : `${n} problems`), pageContent: "Each page’s content appears here." },
  ro: { up: "Mută în sus", down: "Mută în jos", hide: "Ascunde pe site", show: "Arată", remove: "Elimină secțiunea", hidden: "Ascunsă pe site", add: "Adaugă o secțiune aici", settings: "Setările secțiunii", problems: (n: number) => (n === 1 ? "1 problemă" : `${n} probleme`), pageContent: "Aici apare conținutul fiecărei pagini." },
};

/**
 * The section toolbar's Settings button: the section's `choice()` fields
 * (which collection, how many items…), which have no visible place on the
 * page. Shown only for sections that have settings.
 */
function SectionSettings({ section, locale, className }: { section: Section; locale: string; className: string }) {
  const ui = UI[locale === "ro" ? "ro" : "en"];
  const def = getSection(section.type);
  const fields = def ? settingFields(def.schema) : [];
  if (!fields.length) return null;
  const content = section.content as Record<string, unknown>;
  return (
    <Popover>
      <PopoverTrigger className={className} aria-label={ui.settings} title={ui.settings}>
        <SlidersHorizontalIcon />
      </PopoverTrigger>
      <PopoverContent align="start" className="z-70 grid w-64 gap-3 p-3">
        <p className="m-0 text-xs font-semibold text-muted-foreground">{ui.settings}</p>
        {fields.map((field) => (
          <label key={field.key} className="grid gap-1 text-xs font-medium">
            {resolveLabel(field.label ?? field.key, locale)}
            <select
              value={String(content[field.key] ?? "")}
              onChange={(event) => postToEditor({ type: "manifestui:edit", sectionId: section.id, path: field.key, value: event.target.value })}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {resolveLabel(option.label, locale)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** "+ Add section here" between sections. */
function SectionInserter({ afterId, locale }: { afterId: string | null; locale: string }) {
  const ui = UI[locale === "ro" ? "ro" : "en"];
  return (
    <div className="group/insert relative z-55 -my-3 flex h-6 items-center justify-center">
      <span aria-hidden className="absolute inset-x-6 top-1/2 h-px bg-[#22A6C4] opacity-0 transition-opacity group-hover/insert:opacity-100 group-focus-within/insert:opacity-100" />
      <DropdownMenu>
        <DropdownMenuTrigger className="relative inline-flex h-7 items-center gap-1 rounded-full bg-[#0E7490] px-3 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/insert:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100">
          <PlusIcon className="size-3.5" aria-hidden />
          {ui.add}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="z-70 w-56">
          {SECTION_TYPES.map((type) => (
            <DropdownMenuItem key={type} onSelect={() => postToEditor({ type: "manifestui:add-section", afterId, sectionType: type })}>
              {resolveLabel(sectionLabel(type), locale)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * The CMS editor's canvas: renders the draft sections posted by the editor
 * with inline editing on. Texts are edited in place, images replaced in
 * place, lists get add/remove controls, and each section has a hover toolbar
 * (move, hide, remove). Hidden sections show as a bar that can bring them
 * back; sections are added between others. Links don't navigate.
 */
/** The editor's preview frame; uploads go to the site's media storage. */
export function SectionsPreview({ data }: { data: Record<string, unknown> }) {
  return (
    <SiteEditorProvider upload={uploadSiteMedia}>
      <PreviewFrame data={data} />
    </SiteEditorProvider>
  );
}

function PreviewFrame({ data }: { data: Record<string, unknown> }) {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [locale, setLocale] = useState("en");
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent<PreviewMessage>) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type === "manifestui:ping") {
        (event.source as Window | null)?.postMessage({ type: "manifestui:preview-ready" } satisfies PreviewMessage, window.location.origin);
      } else if (data?.type === "manifestui:sections") {
        setSections(parseSections(data.sections));
        if (data.selected !== undefined) setSelected(data.selected);
        if (data.locale) setLocale(data.locale);
        setErrors(data.errors ?? {});
        setFixed(!!data.fixed);
      } else if (data?.type === "manifestui:select") {
        setSelected(data.id);
        // Scroll only this frame: scrollIntoView would also scroll the CMS page around it.
        const el = data.id ? document.querySelector(`[data-section-id="${CSS.escape(data.id)}"]`) : null;
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
      }
    };
    // Editing, not browsing: keep links in the frame from navigating away.
    const onClick = (event: MouseEvent) => {
      // …except editor links (e.g. a collection card's "Edit in CMS"), which open in a new tab.
      const link = (event.target as Element | null)?.closest("a[href]");
      if (link && !link.hasAttribute("data-editor-link")) event.preventDefault();
    };
    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    window.parent?.postMessage({ type: "manifestui:preview-ready" } satisfies PreviewMessage, window.location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
    };
  }, []);


  if (!sections) return <main className="min-h-[60vh]" aria-busy />;

  const ui = UI[locale === "ro" ? "ro" : "en"];
  const tool =
    "flex size-8 items-center justify-center rounded-md text-white/85 hover:bg-white/15 hover:text-white disabled:opacity-40 [&_svg]:size-4";
  const action = (sectionId: string, a: "up" | "down" | "hide" | "show" | "remove") =>
    postToEditor({ type: "manifestui:section-action", sectionId, action: a });

  // Site settings: the editable header, a stand-in for page content, the editable footer.
  if (fixed) {
    const part = (section: Section) => {
      const problems = Object.keys(errors[section.id] ?? {}).length;
      return (
        <div
          key={section.id}
          data-section-id={section.id}
          onFocusCapture={() => postToEditor({ type: "manifestui:selected", id: section.id })}
          className={cn("relative", problems > 0 && "outline-2 -outline-offset-2 outline-red-500 outline-solid")}
        >
          {problems > 0 && (
            <span className="absolute top-1 right-1 z-60 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{ui.problems(problems)}</span>
          )}
          <RenderSections sections={[section]} data={data} edit errors={errors} />
        </div>
      );
    };
    return (
      <>
        {/* The live header comes from the layout; the editable copy replaces it here. */}
        <style>{"header[data-site-header]{display:none}"}</style>
        {sections.slice(0, 1).map(part)}
        <main className="mx-auto flex min-h-[50vh] w-full max-w-300 items-center justify-center px-4 py-16 sm:px-6">
          <p className="m-0 rounded-xl border-2 border-dashed px-6 py-10 text-center text-muted-foreground">{ui.pageContent}</p>
        </main>
        {sections.slice(1).map(part)}
      </>
    );
  }

  return (
    <main>
      <SectionInserter afterId={null} locale={locale} />
      {sections.map((section, index) => {
        const label = resolveLabel(sectionLabel(section.type), locale);
        const problems = Object.keys(errors[section.id] ?? {}).length;
        return (
          <div key={section.id}>
            {section.hidden ? (
              <div
                data-section-id={section.id}
                className="flex items-center justify-between gap-3 border-y border-dashed border-[#22A6C4]/50 bg-[#22A6C4]/5 px-6 py-3 text-sm"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <EyeOffIcon className="size-4" aria-hidden />
                  <strong className="font-semibold text-foreground">{label}</strong> · {ui.hidden}
                </span>
                <span className="flex gap-1">
                  <button type="button" onClick={() => action(section.id, "show")} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0E7490] px-3 text-xs font-semibold text-white hover:bg-[#0B5F75]">
                    <EyeIcon className="size-3.5" aria-hidden />
                    {ui.show}
                  </button>
                  <button type="button" aria-label={ui.remove} title={ui.remove} onClick={() => action(section.id, "remove")} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-red-600 hover:text-white">
                    <Trash2Icon className="size-4" aria-hidden />
                  </button>
                </span>
              </div>
            ) : (
              <div
                data-section-id={section.id}
                onFocusCapture={() => postToEditor({ type: "manifestui:selected", id: section.id })}
                onMouseDownCapture={() => postToEditor({ type: "manifestui:selected", id: section.id })}
                className={cn(
                  "group/section relative -outline-offset-2 hover:outline-2 hover:outline-[#22A6C4]/60 hover:outline-dashed",
                  selected === section.id && "outline-2 outline-[#22A6C4] outline-solid",
                  problems > 0 && "outline-2 outline-red-500 outline-solid hover:outline-red-500 hover:outline-solid",
                )}
              >
                <div
                  className={cn(
                    "absolute top-2 left-2 z-60 flex items-center gap-0.5 rounded-lg bg-[#0E7490] py-0.5 pr-0.5 pl-2.5 shadow-lg",
                    "opacity-0 transition-opacity group-hover/section:opacity-100 focus-within:opacity-100",
                    (selected === section.id || problems > 0) && "opacity-100",
                  )}
                >
                  <span className="mr-1 text-xs font-semibold text-white">{label}</span>
                  {problems > 0 && (
                    <span className="mr-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{ui.problems(problems)}</span>
                  )}
                  <SectionSettings section={section} locale={locale} className={tool} />
                  <button type="button" className={tool} aria-label={ui.up} title={ui.up} disabled={index === 0} onClick={() => action(section.id, "up")}>
                    <ArrowUpIcon />
                  </button>
                  <button type="button" className={tool} aria-label={ui.down} title={ui.down} disabled={index === sections.length - 1} onClick={() => action(section.id, "down")}>
                    <ArrowDownIcon />
                  </button>
                  <button type="button" className={tool} aria-label={ui.hide} title={ui.hide} onClick={() => action(section.id, "hide")}>
                    <EyeOffIcon />
                  </button>
                  <button type="button" className={tool} aria-label={ui.remove} title={ui.remove} onClick={() => action(section.id, "remove")}>
                    <Trash2Icon />
                  </button>
                </div>
                <RenderSections sections={[section]} data={data} edit errors={errors} />
              </div>
            )}
            <SectionInserter afterId={section.id} locale={locale} />
          </div>
        );
      })}
    </main>
  );
}
