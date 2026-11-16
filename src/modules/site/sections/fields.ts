/**
 * Field helpers for section schemas. Each helper is a zod schema that never
 * fails on stored content (missing or malformed values fall back to empty
 * ones) and carries editor metadata, so the editor derives its behaviour from
 * the schema instead of a hand-written field list.
 *
 * Client-safe: used by the site, the preview frame, the CMS editor and the
 * server.
 */
import { z } from "zod";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { MediaKind } from "@/components/site/media/types";

export type FieldMeta =
  | { kind: "text"; label?: TranslatableText; multiline: boolean; required: boolean; maxLength?: number }
  | { kind: "media"; label?: TranslatableText; accept: MediaKind }
  | { kind: "list"; label?: TranslatableText; itemLabel?: TranslatableText; item: z.ZodType; fixed: boolean }
  | { kind: "group"; label?: TranslatableText; shape: Record<string, z.ZodType> }
  | { kind: "choice"; label?: TranslatableText; options: () => Choice[] };

/** One option of a `choice()` field. */
export interface Choice {
  value: string;
  label: TranslatableText;
}

const metas = new WeakMap<z.ZodType, FieldMeta>();

/** Editor metadata of a schema made with a field helper. */
export const fieldMeta = (schema: z.ZodType): FieldMeta | undefined => metas.get(schema);

function tag<S extends z.ZodType>(schema: S, meta: FieldMeta): S {
  metas.set(schema, meta);
  return schema;
}

/**
 * A plain-text value, edited inline on the canvas. `required` and `maxLength`
 * are checked when a page is saved (stored content still reads leniently).
 */
export function text(options: { label?: TranslatableText; multiline?: boolean; required?: boolean; maxLength?: number } = {}) {
  return tag(z.string().catch(""), {
    kind: "text",
    label: options.label,
    multiline: !!options.multiline,
    required: !!options.required,
    maxLength: options.maxLength,
  });
}

/** A list of items; on the canvas each item gets × and the list a "+ Add". `fixed` lists can't grow or shrink. */
export function list<I extends z.ZodType>(
  item: I,
  options: { label?: TranslatableText; itemLabel?: TranslatableText; fixed?: boolean } = {},
) {
  return tag(z.array(item).catch([]), {
    kind: "list",
    label: options.label,
    itemLabel: options.itemLabel,
    item,
    fixed: !!options.fixed,
  });
}

/**
 * One of a set of options, stored as its value: a section setting with no
 * visible place on the page (which collection to show, how many items…).
 * Edited from the section's Settings menu in the page editor. `options` can
 * be a function, for options known only at runtime (registered collections).
 */
export function choice(options: Choice[] | (() => Choice[]), settings: { label?: TranslatableText; default?: string } = {}) {
  const list = typeof options === "function" ? options : () => options;
  return tag(
    z.string().catch(() => settings.default ?? list()[0]?.value ?? ""),
    { kind: "choice", label: settings.label, options: list },
  );
}

/** A nested object (a card, a button pair…). */
export function group<Shape extends Record<string, z.ZodType>>(shape: Shape, options: { label?: TranslatableText } = {}) {
  const object = z.object(shape);
  return tag(
    object.catch(() => object.parse({})),
    { kind: "group", label: options.label, shape },
  );
}

const mediaObject = z.object({ src: z.string().catch(""), width: z.number().catch(0), height: z.number().catch(0) });
export type MediaValue = z.infer<typeof mediaObject>;

/** An uploaded file (Supabase Storage URL) or a path under public/. Empty `src` = none. */
export function media(options: { label?: TranslatableText; accept?: MediaKind } = {}) {
  return tag(
    mediaObject.catch(() => ({ src: "", width: 0, height: 0 })),
    { kind: "media", label: options.label, accept: options.accept ?? "image" },
  );
}

// ─────────────────────────────────────────────
// Walking a schema by content path
// ─────────────────────────────────────────────

type AnyDef = { type: string; innerType?: z.ZodType; shape?: Record<string, z.ZodType>; element?: z.ZodType };
const defOf = (schema: z.ZodType) => (schema as unknown as { def: AnyDef }).def;

/** Strips .catch/.default/.optional/.nullable wrappers. */
function unwrap(schema: z.ZodType): z.ZodType {
  let current = schema;
  for (let def = defOf(current); def.innerType && ["catch", "default", "prefault", "optional", "nullable"].includes(def.type); def = defOf(current))
    current = def.innerType;
  return current;
}

/** The schema at a content path ("items.2.q"), or undefined when the path doesn't exist. */
export function schemaAt(root: z.ZodType, path: string[]): z.ZodType | undefined {
  let current: z.ZodType | undefined = root;
  for (const key of path) {
    if (!current) return undefined;
    const meta = metas.get(current);
    if (meta?.kind === "list") {
      current = /^\d+$/.test(key) ? meta.item : undefined;
      continue;
    }
    const def = defOf(unwrap(current));
    if (def.type === "object") current = def.shape?.[key];
    else if (def.type === "array") current = /^\d+$/.test(key) ? def.element : undefined;
    else return undefined;
  }
  return current;
}

/** The empty value of a schema (what a missing field parses to). */
export function emptyValue(schema: z.ZodType): unknown {
  const fromUndefined = schema.safeParse(undefined);
  if (fromUndefined.success) return fromUndefined.data;
  const fromObject = schema.safeParse({});
  return fromObject.success ? fromObject.data : undefined;
}

// ─────────────────────────────────────────────
// Strict schemas: what a save must satisfy
// ─────────────────────────────────────────────

const strictCache = new WeakMap<z.ZodType, z.ZodType>();
const mapShape = (shape: Record<string, z.ZodType>) =>
  z.strictObject(Object.fromEntries(Object.entries(shape).map(([key, value]) => [key, strictSchema(value)])));

/**
 * The save-time version of a content schema: no fallbacks, so wrong types and
 * unknown keys are refused, and text constraints apply. Missing fields are
 * allowed (they read as empty), except required texts.
 */
export function strictSchema(schema: z.ZodType): z.ZodType {
  const cached = strictCache.get(schema);
  if (cached) return cached;
  const meta = metas.get(schema);
  let strict: z.ZodType;
  if (meta?.kind === "text") {
    let value = z.string({ error: (issue) => (issue.input === undefined ? "Required" : undefined) });
    if (meta.required) value = value.trim().min(1, "Required");
    if (meta.maxLength) value = value.max(meta.maxLength, `At most ${meta.maxLength} characters`);
    strict = meta.required ? value : value.optional();
  } else if (meta?.kind === "media") {
    strict = z.strictObject({ src: z.string(), width: z.number().nonnegative(), height: z.number().nonnegative() }).partial().optional();
  } else if (meta?.kind === "list") {
    strict = z.array(strictSchema(meta.item)).optional();
  } else if (meta?.kind === "choice") {
    strict = z
      .string()
      .refine((value) => !value || meta.options().some((option) => option.value === value), { message: "Not one of the options" })
      .optional();
  } else if (meta?.kind === "group") {
    strict = mapShape(meta.shape).optional();
  } else {
    const inner = unwrap(schema);
    const def = defOf(inner);
    if (def.type === "object" && def.shape) strict = mapShape(def.shape);
    else if (def.type === "array" && def.element) strict = z.array(strictSchema(def.element)).optional();
    else strict = inner.optional();
  }
  strictCache.set(schema, strict);
  return strict;
}

/** A section's settings: its top-level `choice()` fields, edited from the section's Settings menu. */
export function settingFields(schema: z.ZodType): { key: string; label?: TranslatableText; options: Choice[] }[] {
  const def = defOf(unwrap(schema));
  if (def.type !== "object" || !def.shape) return [];
  return Object.entries(def.shape).flatMap(([key, field]) => {
    const meta = metas.get(field);
    return meta?.kind === "choice" ? [{ key, label: meta.label, options: meta.options() }] : [];
  });
}

/** Readable labels along a content path ("items.1.a" → ["Questions", "Question 2", "Answer"]). */
export function labelPath(root: z.ZodType, path: (string | number)[], resolve: (label: TranslatableText) => string): string[] {
  const labels: string[] = [];
  let current: z.ZodType | undefined = root;
  let listMeta: Extract<FieldMeta, { kind: "list" }> | undefined;
  for (const segment of path.map(String)) {
    if (listMeta && /^\d+$/.test(segment)) {
      labels.push(`${listMeta.itemLabel ? resolve(listMeta.itemLabel) : "#"} ${Number(segment) + 1}`);
      current = listMeta.item;
      listMeta = undefined;
      continue;
    }
    const next: z.ZodType | undefined = current ? schemaAt(current, [segment]) : undefined;
    const meta = next ? metas.get(next) : undefined;
    labels.push(meta?.label ? resolve(meta.label) : segment);
    listMeta = meta?.kind === "list" ? meta : undefined;
    current = next;
  }
  return labels;
}

/** A blank item for the list at `path`, or null when it isn't a list that can grow. */
export function blankItemAt(root: z.ZodType, path: string): unknown {
  const schema = schemaAt(root, path.split("."));
  if (!schema) return null;
  const meta = metas.get(schema);
  if (meta?.kind === "list") return meta.fixed ? null : emptyValue(meta.item);
  const def = defOf(unwrap(schema));
  return def.type === "array" && def.element ? emptyValue(def.element) : null;
}
