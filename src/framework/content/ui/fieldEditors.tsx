"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownIcon, ArrowUpIcon, ImageIcon, Loader2Icon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/framework/lib/utils";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { TranslatableText } from "@/framework/types/i18n-types";
import { emptyValue, fieldMeta, shapeOf, type MediaValue } from "../fields";
import { MEDIA_TYPES, type MediaKind } from "../media";
import { BlocksField } from "./BlocksField";
import { LinkField, ReferenceField } from "./ReferenceField";
import { useContentEditor } from "./context";

const humanize = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

/** The label of a field: its own, else its key made readable. */
export function useFieldLabel(schema: z.ZodType, key: string) {
  const locale = useLocale();
  const label = fieldMeta(schema)?.label as TranslatableText | undefined;
  return label ? resolveLabel(label, locale) : humanize(key);
}

type AnyDef = { type: string; innerType?: z.ZodType };
const baseType = (schema: z.ZodType): string => {
  let def = (schema as unknown as { def: AnyDef }).def;
  while (def.innerType && ["catch", "default", "prefault", "optional", "nullable"].includes(def.type))
    def = (def.innerType as unknown as { def: AnyDef }).def;
  return def.type;
};

/** One field's frame: label, control, the form's error for it. */
function Frame({ id, label, name, children, hint }: { id?: string; label: string; name: string; children: ReactNode; hint?: string }) {
  const { errors } = useFormState({ name });
  const error = name.split(".").reduce<unknown>((at, key) => (at as Record<string, unknown> | undefined)?.[key], errors) as { message?: string } | undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-cms-field-editor={name}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="m-0 text-xs text-muted-foreground">{hint}</p>}
      {error?.message && <p className="m-0 text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

/** Reads and writes one form value, marking the form dirty. */
export function useFieldValue<T>(name: string) {
  const { control, setValue, getValues } = useFormContext();
  const value = useWatch({ control, name }) as T;
  return {
    value,
    set: (next: T) => setValue(name, next, { shouldDirty: true, shouldValidate: false }),
    get: () => getValues(name) as T,
  };
}

/**
 * Draws the editor for a content field from its schema: texts, rich text,
 * choices, media, groups, lists, blocks, references and links. `name` is the
 * form path ("sections.2.content.title").
 */
export function ContentFieldEditor({ name, schema, fieldKey, disabled }: { name: string; schema: z.ZodType; fieldKey: string; disabled?: boolean }) {
  const meta = fieldMeta(schema);
  const label = useFieldLabel(schema, fieldKey);
  switch (meta?.kind) {
    case "text":
      return <TextEditor name={name} label={label} multiline={meta.multiline} disabled={disabled} />;
    case "richText":
      return <TextEditor name={name} label={label} multiline rich disabled={disabled} />;
    case "choice":
      return <ChoiceEditor name={name} label={label} options={meta.options()} disabled={disabled} />;
    case "media":
      return <MediaEditor name={name} label={label} accept={meta.accept} disabled={disabled} />;
    case "group":
      return <GroupEditor name={name} label={label} shape={meta.shape} disabled={disabled} />;
    case "list":
      return <ListEditor name={name} label={label} item={meta.item} fixed={meta.fixed} itemLabel={meta.itemLabel} disabled={disabled} />;
    case "blocks":
      return <BlocksField name={name} schema={schema} label={label} disabled={disabled} />;
    case "reference":
      return <ReferenceField name={name} label={label} to={meta.to} many={meta.many} max={meta.max} disabled={disabled} />;
    case "link":
      return <LinkField name={name} label={label} types={meta.types} disabled={disabled} />;
  }
  const shape = shapeOf(schema);
  if (shape) return <GroupEditor name={name} label={label} shape={shape} disabled={disabled} />;
  const type = baseType(schema);
  if (type === "number") return <NumberEditor name={name} label={label} disabled={disabled} />;
  if (type === "boolean") return <BooleanEditor name={name} label={label} disabled={disabled} />;
  return <TextEditor name={name} label={label} disabled={disabled} />;
}

/** Every field of an object schema, in a responsive grid (long texts and nested fields take the full width). */
export function ContentFields({ name, shape, disabled }: { name: string; shape: Record<string, z.ZodType>; disabled?: boolean }) {
  const wide = (schema: z.ZodType) => {
    const meta = fieldMeta(schema);
    return !meta || ["group", "list", "blocks", "richText", "media", "reference", "link"].includes(meta.kind) || (meta.kind === "text" && meta.multiline);
  };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(shape).map(([key, schema]) => (
        <div key={key} className={cn("min-w-0", wide(schema) && "md:col-span-2")}>
          <ContentFieldEditor name={name ? `${name}.${key}` : key} schema={schema} fieldKey={key} disabled={disabled} />
        </div>
      ))}
    </div>
  );
}

function TextEditor({ name, label, multiline, rich, disabled }: { name: string; label: string; multiline?: boolean; rich?: boolean; disabled?: boolean }) {
  const id = useId();
  const { register } = useFormContext();
  return (
    <Frame id={id} label={label} name={name} hint={rich ? "Markdown" : undefined}>
      {multiline ? (
        <Textarea id={id} rows={rich ? 10 : 3} className={cn(rich && "font-mono text-sm")} disabled={disabled} {...register(name)} />
      ) : (
        <Input id={id} disabled={disabled} {...register(name)} />
      )}
    </Frame>
  );
}

function NumberEditor({ name, label, disabled }: { name: string; label: string; disabled?: boolean }) {
  const id = useId();
  const { register } = useFormContext();
  return (
    <Frame id={id} label={label} name={name}>
      <Input id={id} type="number" inputMode="numeric" disabled={disabled} {...register(name, { valueAsNumber: true })} />
    </Frame>
  );
}

function BooleanEditor({ name, label, disabled }: { name: string; label: string; disabled?: boolean }) {
  const id = useId();
  const { value, set } = useFieldValue<boolean>(name);
  return (
    <div className="flex min-h-10 items-center gap-3" data-cms-field-editor={name}>
      <Switch id={id} checked={!!value} onCheckedChange={(checked) => set(checked)} disabled={disabled} />
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
    </div>
  );
}

function ChoiceEditor({ name, label, options, disabled }: { name: string; label: string; options: { value: string; label: TranslatableText }[]; disabled?: boolean }) {
  const id = useId();
  const locale = useLocale();
  const { register } = useFormContext();
  return (
    <Frame id={id} label={label} name={name}>
      <select
        id={id}
        disabled={disabled}
        className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        {...register(name)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {resolveLabel(option.label, locale)}
          </option>
        ))}
      </select>
    </Frame>
  );
}

function GroupEditor({ name, label, shape, disabled }: { name: string; label: string; shape: Record<string, z.ZodType>; disabled?: boolean }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <ContentFields name={name} shape={shape} disabled={disabled} />
    </fieldset>
  );
}

function ListEditor({
  name,
  label,
  item,
  fixed,
  itemLabel,
  disabled,
}: {
  name: string;
  label: string;
  item: z.ZodType;
  fixed: boolean;
  itemLabel?: TranslatableText;
  disabled?: boolean;
}) {
  const t = useTranslations("Content.fields");
  const locale = useLocale();
  const { value, set } = useFieldValue<unknown[]>(name);
  const items = Array.isArray(value) ? value : [];
  const isObject = !!shapeOf(item);
  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    set(next);
  };
  const itemName = (index: number) => (itemLabel ? `${resolveLabel(itemLabel, locale)} ${index + 1}` : t("item", { number: index + 1 }));
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 rounded-lg border p-3">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      {items.map((_, index) => (
        <div key={index} className="flex min-w-0 flex-col gap-2 rounded-md border bg-muted/30 p-2.5">
          <div className="flex items-center gap-1">
            <span className="flex-1 text-xs font-semibold text-muted-foreground">{itemName(index)}</span>
            {!disabled && (
              <>
                <Button type="button" size="icon-sm" variant="ghost" aria-label={t("moveUp")} disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUpIcon aria-hidden />
                </Button>
                <Button type="button" size="icon-sm" variant="ghost" aria-label={t("moveDown")} disabled={index === items.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowDownIcon aria-hidden />
                </Button>
                {!fixed && (
                  <Button type="button" size="icon-sm" variant="ghost" aria-label={t("remove")} onClick={() => set(items.filter((__, at) => at !== index))}>
                    <Trash2Icon aria-hidden />
                  </Button>
                )}
              </>
            )}
          </div>
          {isObject ? (
            <ContentFields name={`${name}.${index}`} shape={shapeOf(item)!} disabled={disabled} />
          ) : (
            <ContentFieldEditor name={`${name}.${index}`} schema={item} fieldKey={itemName(index)} disabled={disabled} />
          )}
        </div>
      ))}
      {!fixed && !disabled && (
        <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => set([...items, structuredClone(emptyValue(item))])}>
          <PlusIcon aria-hidden />
          {t("add")}
        </Button>
      )}
    </fieldset>
  );
}

function MediaEditor({ name, label, accept, disabled }: { name: string; label: string; accept: MediaKind; disabled?: boolean }) {
  const t = useTranslations("Content.fields");
  const id = useId();
  const { upload } = useContentEditor();
  const { value, set } = useFieldValue<MediaValue>(name);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const media = value ?? { src: "", width: 0, height: 0 };
  const onFile = async (file: File | undefined) => {
    if (!file || !upload) return;
    setBusy(true);
    setError(null);
    try {
      set(await upload(file, accept));
    } catch (err) {
      setError(t("uploadFailed", { message: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Frame id={id} label={label} name={name}>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {media.src && accept === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.src} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
          )}
        </div>
        <Input id={id} className="min-w-0 flex-1" value={media.src} disabled={disabled} onChange={(event) => set({ ...media, src: event.target.value })} />
        {!disabled && upload && (
          <>
            <input ref={input} type="file" hidden accept={MEDIA_TYPES[accept].accept} onChange={(event) => onFile(event.target.files?.[0])} />
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? <Loader2Icon className="animate-spin" aria-hidden /> : <UploadIcon aria-hidden />}
              {busy ? t("uploading") : media.src ? t("replace") : t("upload")}
            </Button>
          </>
        )}
        {!disabled && media.src && (
          <Button type="button" size="sm" variant="ghost" onClick={() => set({ src: "", width: 0, height: 0 })}>
            {t("removeMedia")}
          </Button>
        )}
      </div>
      {error && <p className="m-0 text-xs text-destructive">{error}</p>}
    </Frame>
  );
}
