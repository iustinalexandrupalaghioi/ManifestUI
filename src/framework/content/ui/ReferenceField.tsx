"use client";

import { use, useEffect, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, GripVerticalIcon, Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/framework/lib/utils";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { parseLink, type LinkValue } from "../fields";
import { EntryLocaleContext, useContentEditor, type ContentOption } from "./context";
import { useFieldValue } from "./fieldEditors";
import { SortableList } from "./Sortable";
import { StatusPill } from "./StatusPill";

/** Titles and statuses of these entries in `locale`, for chips. */
function useEntryOptions(type: string, entryIds: string[], locale: string) {
  const { actions } = useContentEditor();
  const key = [...entryIds].sort().join(",");
  return useQuery({
    queryKey: ["content-options", type, locale, "ids", key],
    enabled: entryIds.length > 0,
    queryFn: async () => {
      const result = await actions.options(type, { locale, entryIds, limit: 100 });
      return result.ok ? result.data : [];
    },
  });
}

/** The picker dialog: search the target type's entries in the entry's locale. */
function EntryPicker({
  open,
  onOpenChange,
  type,
  locale,
  selected,
  onPick,
  canPickMore,
  typeChoices,
  onTypeChange,
}: {
  /** Link fields: the content types to pick from, switched inside the dialog. */
  typeChoices?: { name: string; label: string }[];
  onTypeChange?: (type: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: string;
  locale: string;
  selected: string[];
  onPick: (option: ContentOption) => void;
  canPickMore: boolean;
}) {
  const t = useTranslations("Content.reference");
  const { actions } = useContentEditor();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ["content-options", type, locale, "search", debounced],
    enabled: open,
    queryFn: async () => {
      const result = await actions.options(type, { locale, search: debounced || undefined, limit: 30 });
      return result.ok ? result.data : [];
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
        </DialogHeader>
        {typeChoices && typeChoices.length > 1 && (
          <div role="group" className="flex flex-wrap gap-1">
            {typeChoices.map((choice) => (
              <Button key={choice.name} type="button" size="sm" variant={choice.name === type ? "default" : "outline"} aria-pressed={choice.name === type} onClick={() => onTypeChange?.(choice.name)}>
                {choice.label}
              </Button>
            ))}
          </div>
        )}
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("search")} aria-label={t("search")} className="pl-8" />
        </div>
        <ul className="m-0 flex max-h-[55vh] list-none flex-col gap-1 overflow-y-auto p-0">
          {query.isLoading && (
            <li className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {t("loading")}
            </li>
          )}
          {query.data?.map((option) => {
            const picked = selected.includes(option.entryId);
            return (
              <li key={option.entryId}>
                <button
                  type="button"
                  disabled={!picked && !canPickMore}
                  onClick={() => onPick(option)}
                  aria-pressed={picked}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50",
                    picked && "border-primary/60 bg-primary/5",
                  )}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">{picked && <CheckIcon className="size-4 text-primary" aria-hidden />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{option.title || t("untitled")}</span>
                    {option.slug && <span className="block truncate font-mono text-xs text-muted-foreground">{option.slug}</span>}
                  </span>
                  <StatusPill status={option.status} />
                </button>
              </li>
            );
          })}
          {query.data?.length === 0 && <li className="p-3 text-center text-sm text-muted-foreground">{t("noResults")}</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** A reference field: chips for the chosen entries (drag to reorder) and a picker over the target type. */
export function ReferenceField({ name, label, to, many, max, disabled }: { name: string; label: string; to: string; many: boolean; max?: number; disabled?: boolean }) {
  const t = useTranslations("Content.reference");
  const id = useId();
  const uiLocale = useLocale();
  const locale = use(EntryLocaleContext) ?? uiLocale;
  const { value, set } = useFieldValue<string[] | string | null>(name);
  const ids = many ? (Array.isArray(value) ? value : []) : typeof value === "string" && value ? [value] : [];
  const [open, setOpen] = useState(false);
  const known = useEntryOptions(to, ids, locale);
  const optionFor = (entryId: string) => known.data?.find((option) => option.entryId === entryId);
  const canPickMore = many ? max === undefined || ids.length < max : true;
  const write = (next: string[]) => set(many ? next : (next[next.length - 1] ?? null));
  const toggle = (option: ContentOption) => {
    if (ids.includes(option.entryId)) write(ids.filter((entryId) => entryId !== option.entryId));
    else {
      write(many ? [...ids, option.entryId] : [option.entryId]);
      if (!many) setOpen(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-cms-field-editor={name}>
      <span id={id} className="text-sm font-medium">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-2" aria-labelledby={id}>
        <SortableList
          items={ids.map((entryId) => ({ id: entryId }))}
          group={`reference:${name}`}
          onMove={(from, to) => {
            const next = [...ids];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            write(next);
          }}
        >
          {({ id: entryId }, _index, { ref, handleRef }) => {
            const option = optionFor(entryId);
            const title = option ? option.title || t("untitled") : known.isLoading ? "…" : t("missing");
            return (
              <span ref={ref as React.Ref<HTMLSpanElement>} className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/50 py-0.5 pr-1 pl-1.5 text-sm">
                {many && !disabled && (
                  <span ref={handleRef as React.Ref<HTMLSpanElement>} className="cursor-grab text-muted-foreground" aria-hidden>
                    <GripVerticalIcon className="size-3.5" />
                  </span>
                )}
                <span className="truncate">{title}</span>
                {option && option.status !== "published" && option.status !== "draft-changes" && <StatusPill status={option.status} className="px-1.5 py-0 text-[10px]" />}
                {!disabled && (
                  <button
                    type="button"
                    aria-label={t("remove", { title })}
                    onClick={() => write(ids.filter((idItem) => idItem !== entryId))}
                    className="flex size-6 items-center justify-center rounded-full hover:bg-muted"
                  >
                    <XIcon className="size-3.5" aria-hidden />
                  </button>
                )}
              </span>
            );
          }}
        </SortableList>
        {!disabled && (
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!canPickMore && many}>
            {t("choose")}
          </Button>
        )}
      </div>
      {many && max !== undefined && <p className="m-0 text-xs text-muted-foreground">{t("max", { max })}</p>}
      <EntryPicker open={open} onOpenChange={setOpen} type={to} locale={locale} selected={ids} onPick={toggle} canPickMore={canPickMore} />
    </div>
  );
}

/** A link field: an entry (type and entry picker; follows its address) or a URL. */
export function LinkField({ name, label, types, disabled }: { name: string; label: string; types?: readonly string[]; disabled?: boolean }) {
  const t = useTranslations("Content.link");
  const id = useId();
  const uiLocale = useLocale();
  const locale = use(EntryLocaleContext) ?? uiLocale;
  const { linkTypes } = useContentEditor();
  const { value, set } = useFieldValue<LinkValue | string>(name);
  const link = parseLink(value);
  const choices = linkTypes.filter((type) => !types || types.includes(type.name));
  const [entryType, setEntryType] = useState(link.kind === "entry" ? link.type : (choices[0]?.name ?? ""));
  const [open, setOpen] = useState(false);
  const chosen = useEntryOptions(link.kind === "entry" ? link.type : "", link.kind === "entry" ? [link.entryId] : [], locale);
  const option = link.kind === "entry" ? chosen.data?.[0] : undefined;
  const segment = "h-8 rounded-none border-0 px-3 text-sm";

  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-cms-field-editor={name}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-md border">
          <Button type="button" variant={link.kind === "url" ? "default" : "ghost"} className={segment} disabled={disabled} aria-pressed={link.kind === "url"} onClick={() => link.kind !== "url" && set({ kind: "url", href: "" })}>
            {t("url")}
          </Button>
          <Button type="button" variant={link.kind === "entry" ? "default" : "ghost"} className={segment} disabled={disabled || choices.length === 0} aria-pressed={link.kind === "entry"} onClick={() => link.kind !== "entry" && setOpen(true)}>
            {t("entry")}
          </Button>
        </div>
        {link.kind === "url" ? (
          <Input id={id} className="min-w-0 flex-1 font-mono text-sm" value={link.href} placeholder={t("urlPlaceholder")} disabled={disabled} onChange={(event) => set({ kind: "url", href: event.target.value })} />
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm">
              {resolveLabel(linkTypes.find((type) => type.name === link.type)?.label ?? link.type, uiLocale)}: {option?.title || (chosen.isLoading ? "…" : "?")}
            </span>
            {option && option.status !== "published" && option.status !== "draft-changes" && <StatusPill status={option.status} />}
            {!disabled && (
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
                {t("change")}
              </Button>
            )}
          </span>
        )}
      </div>
      {link.kind === "entry" && <p className="m-0 text-xs text-muted-foreground">{t("followsHint")}</p>}
      <EntryPicker
        open={open}
        onOpenChange={setOpen}
        type={entryType}
        typeChoices={choices.map((type) => ({ name: type.name, label: resolveLabel(type.label, uiLocale) }))}
        onTypeChange={setEntryType}
        locale={locale}
        selected={link.kind === "entry" ? [link.entryId] : []}
        canPickMore
        onPick={(picked) => {
          set({ kind: "entry", type: entryType, entryId: picked.entryId });
          setOpen(false);
        }}
      />
    </div>
  );
}
