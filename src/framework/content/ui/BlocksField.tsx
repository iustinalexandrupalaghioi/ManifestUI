"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/framework/lib/utils";
import { STICKY_IN_RECORD } from "@/framework/lib/sticky";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { blockSummary, type AnyBlockDef, type StoredBlock } from "../blocks";
import { addBlock, duplicateBlock, moveBlock, pickerBlocks, removeBlock, toggleBlockHidden } from "../blockOps";
import { fieldMeta } from "../fields";
import { EntryLocaleContext } from "./context";
import { ContentFields } from "./fieldEditors";
import { SortableList } from "./Sortable";
import { REVEAL_FIELD_EVENT } from "./revealField";

/**
 * A blocks field: each block a collapsible card (drag handle, label pill,
 * summary, Duplicate / Hide / Remove), its fields drawn from its schema when
 * open. Add block opens a picker with only the field's allowed blocks and
 * inserts at the chosen place, prefilled with the block's defaults.
 */
export function BlocksField({ name, schema, label, disabled }: { name: string; schema: z.ZodType; label: string; disabled?: boolean }) {
  const t = useTranslations("Content.blocks");
  const uiLocale = useLocale();
  const { control, setValue } = useFormContext();
  const meta = fieldMeta(schema);
  const allowed = useMemo(() => (meta?.kind === "blocks" ? (meta.blocks() as readonly AnyBlockDef[]) : []), [meta]);
  const max = meta?.kind === "blocks" ? meta.max : undefined;
  const watched = useWatch({ control, name }) as StoredBlock[] | undefined;
  const blocks = Array.isArray(watched) ? watched : [];
  const entryLocale = use(EntryLocaleContext) ?? uiLocale;
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [pickerAt, setPickerAt] = useState<number | null>(null);

  // The preview asks to show a field inside a block: open that block.
  useEffect(() => {
    const onReveal = (event: Event) => {
      const target = (event as CustomEvent<string>).detail;
      if (!target.startsWith(`${name}.`)) return;
      const block = blocks[Number(target.slice(name.length + 1).split(".")[0])];
      if (block) setOpen((current) => new Set(current).add(block.id));
    };
    window.addEventListener(REVEAL_FIELD_EVENT, onReveal);
    return () => window.removeEventListener(REVEAL_FIELD_EVENT, onReveal);
  }, [name, blocks]);

  const write = (next: StoredBlock[]) => setValue(name, next, { shouldDirty: true });
  const byType = (type: string) => allowed.find((def) => def.type === type);
  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const atMax = max !== undefined && blocks.length >= max;

  const insert = (def: AnyBlockDef) => {
    const at = pickerAt ?? blocks.length;
    const next = addBlock(blocks, def, entryLocale, at);
    write(next);
    setOpen((current) => new Set(current).add(next[at].id));
    setPickerAt(null);
  };

  const inserter = (index: number) =>
    !disabled &&
    !atMax && (
      <div className="group/insert relative -my-1 flex h-4 items-center justify-center">
        <span aria-hidden className="absolute inset-x-3 top-1/2 h-px bg-primary opacity-0 transition-opacity group-hover/insert:opacity-100 group-focus-within/insert:opacity-100" />
        <button
          type="button"
          onClick={() => setPickerAt(index)}
          className="relative inline-flex h-6 items-center gap-1 rounded-full border bg-background px-2 text-xs font-medium opacity-0 shadow-sm transition-opacity group-hover/insert:opacity-100 focus-visible:opacity-100"
        >
          <PlusIcon className="size-3" aria-hidden />
          {t("addHere")}
        </button>
      </div>
    );

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-label={label} data-cms-field-editor={name}>
      {/* The field header (count, Collapse all) stays in view while its blocks scroll. */}
      <div className={cn("flex flex-wrap items-center gap-2 py-2", STICKY_IN_RECORD)}>
        <h3 className="m-0 flex items-baseline gap-2 text-base font-medium text-primary">
          {label}
          <span className="text-xs font-normal text-muted-foreground">{t("count", { count: blocks.length })}</span>
        </h3>
        <span className="flex-1" />
        {blocks.length > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(open.size ? new Set() : new Set(blocks.map((block) => block.id)))}>
            {open.size ? t("collapseAll") : t("expandAll")}
          </Button>
        )}
      </div>

      {blocks.length === 0 && <p className="m-0 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{t("empty")}</p>}

      <div className="flex flex-col gap-2">
        <SortableList items={blocks} group={`blocks:${name}`} onMove={(from, to) => write(moveBlock(blocks, from, to))}>
          {(block, index, { ref, handleRef, isDragging }) => {
            const def = byType(block.type);
            const isOpen = open.has(block.id);
            const summary = blockSummary(def, block.content);
            const blockLabel = def ? resolveLabel(def.label, uiLocale) : block.type;
            return (
              <div ref={ref as React.Ref<HTMLDivElement>} className="flex flex-col gap-2" data-cms-block={block.id}>
                {index > 0 && inserter(index)}
                <article
                  className={cn(
                    "rounded-lg border bg-card transition-shadow",
                    isOpen && "border-primary/60",
                    block.hidden && "border-dashed opacity-70",
                    isDragging && "shadow-lg",
                  )}
                >
                  <div className="flex min-h-11 items-center gap-2 px-2 py-1.5">
                    {!disabled && (
                      <button
                        type="button"
                        ref={handleRef as React.Ref<HTMLButtonElement>}
                        aria-label={t("drag")}
                        className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
                      >
                        <GripVerticalIcon className="size-4" aria-hidden />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggle(block.id)}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? t("collapse") : t("expand")}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-left"
                    >
                      <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{blockLabel}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{summary}</span>
                      {block.hidden && <span className="shrink-0 text-xs text-muted-foreground">{t("hidden")}</span>}
                      <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                    </button>
                    {!disabled && (
                      <div className="flex shrink-0 items-center">
                        <Button type="button" size="icon-sm" variant="ghost" className="max-sm:hidden" aria-label={t("moveUp")} disabled={index === 0} onClick={() => write(moveBlock(blocks, index, index - 1))}>
                          <ArrowUpIcon aria-hidden />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" className="max-sm:hidden" aria-label={t("moveDown")} disabled={index === blocks.length - 1} onClick={() => write(moveBlock(blocks, index, index + 1))}>
                          <ArrowDownIcon aria-hidden />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" aria-label={t("duplicate")} title={t("duplicate")} disabled={atMax || !def} onClick={() => write(duplicateBlock(blocks, index))}>
                          <CopyIcon aria-hidden />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" aria-label={block.hidden ? t("show") : t("hide")} title={block.hidden ? t("show") : t("hide")} onClick={() => write(toggleBlockHidden(blocks, index))}>
                          {block.hidden ? <EyeIcon aria-hidden /> : <EyeOffIcon aria-hidden />}
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" className="text-destructive" aria-label={t("remove")} title={t("remove")} onClick={() => write(removeBlock(blocks, index))}>
                          <Trash2Icon aria-hidden />
                        </Button>
                      </div>
                    )}
                  </div>
                  {isOpen && (
                    <div className="border-t p-3">
                      {def ? (
                        <ContentFields name={`${name}.${index}.content`} shape={def.fields.shape} disabled={disabled} />
                      ) : (
                        <p className="m-0 flex items-start gap-2 text-sm text-muted-foreground">
                          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                          {t("unknown", { type: block.type })}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              </div>
            );
          }}
        </SortableList>
      </div>

      {!disabled && (
        <Button type="button" variant="outline" className="border-dashed" disabled={atMax} onClick={() => setPickerAt(blocks.length)}>
          <PlusIcon aria-hidden />
          {t("add")}
        </Button>
      )}
      {atMax && <p className="m-0 text-xs text-muted-foreground">{t("max", { max: max! })}</p>}

      <BlockPicker open={pickerAt !== null} onOpenChange={(value) => !value && setPickerAt(null)} allowed={allowed} onPick={insert} />
    </section>
  );
}

function BlockPicker({
  open,
  onOpenChange,
  allowed,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowed: readonly AnyBlockDef[];
  onPick: (def: AnyBlockDef) => void;
}) {
  const t = useTranslations("Content.blocks");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const choices = pickerBlocks(allowed, search, locale);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setSearch("");
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("pickerTitle")}</DialogTitle>
          <DialogDescription>{t("pickerHint")}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("search")} aria-label={t("search")} className="pl-8" />
        </div>
        <ul className="m-0 grid max-h-[60vh] list-none gap-2 overflow-y-auto p-0 sm:grid-cols-2">
          {choices.map((def) => (
            <li key={def.type}>
              <button
                type="button"
                onClick={() => onPick(def)}
                className="flex h-full min-h-14 w-full flex-col items-start gap-0.5 rounded-lg border p-3 text-left hover:border-primary/60 hover:bg-primary/5 focus-visible:border-primary focus-visible:outline-none"
              >
                <span className="text-sm font-semibold">{resolveLabel(def.label, locale)}</span>
                {def.description && <span className="text-xs text-muted-foreground">{resolveLabel(def.description, locale)}</span>}
              </button>
            </li>
          ))}
        </ul>
        {choices.length === 0 && <p className="m-0 text-center text-sm text-muted-foreground">{t("noMatch")}</p>}
      </DialogContent>
    </Dialog>
  );
}
