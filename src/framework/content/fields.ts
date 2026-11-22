/**
 * Field helpers for content schemas (content types and blocks). Each helper is a zod schema that never
 * fails on stored content (missing or malformed values fall back to empty
 * ones) and carries editor metadata, so the editor derives its behaviour from
 * the schema instead of a hand-written field list.
 *
 * Client-safe: used by the site, the preview frame, the CMS editor and the
 * server.
 */
import { z } from "zod";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { MediaKind } from "./media";

export type FieldMeta =
  | { kind: "text"; label?: TranslatableText; multiline: boolean; required: boolean; maxLength?: number }
  | { kind: "media"; label?: TranslatableText; accept: MediaKind }
  | { kind: "list"; label?: TranslatableText; itemLabel?: TranslatableText; item: z.ZodType; fixed: boolean }
  | { kind: "group"; label?: TranslatableText; shape: Record<string, z.ZodType> }
  | { kind: "choice"; label?: TranslatableText; options: () => Choice[] }
  | { kind: "richText"; label?: TranslatableText; required: boolean }
  | { kind: "reference"; label?: TranslatableText; to: string; many: boolean; max?: number; required: boolean }
  | { kind: "link"; label?: TranslatableText; types?: readonly string[]; required: boolean }
  | {
      kind: "blocks";
      label?: TranslatableText;
      /** The blocks editors may add here, in picker order. */
      blocks: () => readonly BlockDefLike[];
      min?: number;
      max?: number;
      /** The save-time schema (defined next to the blocks helper, which owns block validation). */
      strict: () => z.ZodType;
    };

/** What this module needs to know about a block (the full type is BlockDef in ./blocks). */
export interface BlockDefLike {
  type: string;
  label: TranslatableText;
  description?: TranslatableText;
  fields: z.ZodType;
}

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

/** Attaches editor metadata to a schema; for field helpers defined outside this file (blocks). */
export const tagField = <S extends z.ZodType>(schema: S, meta: FieldMeta): S => tag(schema, meta);

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

/** Formatted text, stored as Markdown. */
export function richText(options: { label?: TranslatableText; required?: boolean } = {}) {
  return tag(z.string().catch(""), { kind: "richText", label: options.label, required: !!options.required });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isEntryId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

declare const ENTRY_REF: unique symbol;
/** An entry id stored by a reference field. The content layer replaces it with the entry it points to. */
export type EntryRef = string & { readonly [ENTRY_REF]: true };

/**
 * Entries of another content type, stored as their `entry_id`s (the same in
 * every locale). The content layer resolves them to the published entries in
 * the reader's locale and drops missing ones.
 */
export function reference(to: string, options: { many: true; max?: number; label?: TranslatableText; required?: boolean }): z.ZodType<EntryRef[], unknown>;
export function reference(to: string, options?: { many?: false; label?: TranslatableText; required?: boolean }): z.ZodType<EntryRef | null, unknown>;
export function reference(
  to: string,
  options: { many?: boolean; max?: number; label?: TranslatableText; required?: boolean } = {},
): z.ZodType<EntryRef[] | EntryRef | null, unknown> {
  const meta: FieldMeta = { kind: "reference", label: options.label, to, many: !!options.many, max: options.max, required: !!options.required };
  if (options.many)
    return tag(
      z.unknown().optional().transform((value) => (Array.isArray(value) ? ([...new Set(value.filter(isEntryId))] as EntryRef[]) : [])),
      meta,
    );
  return tag(
    z.unknown().optional().transform((value) => (isEntryId(value) ? (value as EntryRef) : null)),
    meta,
  );
}

/** Where a link goes: an entry (follows its address when the slug changes) or a URL. */
export type LinkValue =
  /** `href` is the entry's address once the content layer has resolved it (never stored). */
  | { kind: "entry"; type: string; entryId: string; href?: string }
  | { kind: "url"; href: string };

/** Addresses a link may hold: site paths, anchors, web, mail and phone links (never `javascript:`). */
export const SAFE_HREF = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

/** Reads a stored link leniently; a bare string (the older shape) is a URL. */
export function parseLink(value: unknown): LinkValue {
  if (typeof value === "string") return { kind: "url", href: value };
  if (value && typeof value === "object") {
    const raw = value as Record<string, unknown>;
    if (raw.kind === "entry" && typeof raw.type === "string" && isEntryId(raw.entryId))
      // A resolved link keeps its address, so re-reading resolved content doesn't lose it.
      return typeof raw.href === "string"
        ? { kind: "entry", type: raw.type, entryId: raw.entryId, href: raw.href }
        : { kind: "entry", type: raw.type, entryId: raw.entryId };
    if (typeof raw.href === "string") return { kind: "url", href: raw.href };
  }
  return { kind: "url", href: "" };
}

/** The address of any link value: a URL link's href, a resolved entry link's address, an older plain string; "" otherwise. */
export function linkHref(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as { href?: unknown }).href === "string") return (value as { href: string }).href;
  return "";
}

/** A link field; `types` limits which content types its entry picker offers. */
export function link(options: { label?: TranslatableText; types?: readonly string[]; required?: boolean } = {}) {
  return tag(z.unknown().optional().transform(parseLink) as z.ZodType<LinkValue, unknown>, {
    kind: "link",
    label: options.label,
    types: options.types,
    required: !!options.required,
  });
}

// ─────────────────────────────────────────────
// Walking a schema by content path
// ─────────────────────────────────────────────

type AnyDef = { type: string; innerType?: z.ZodType; shape?: Record<string, z.ZodType>; element?: z.ZodType };
const defOf = (schema: z.ZodType) => (schema as unknown as { def: AnyDef }).def;

/** The fields of an object schema (through .catch/.default wrappers), or undefined when it is not one. */
export function shapeOf(schema: z.ZodType): Record<string, z.ZodType> | undefined {
  const meta = metas.get(schema);
  if (meta?.kind === "group") return meta.shape;
  const def = defOf(unwrap(schema));
  return def.type === "object" ? def.shape : undefined;
}

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
  } else if (meta?.kind === "richText") {
    const value = z.string();
    strict = meta.required ? value.trim().min(1, "Required") : value.optional();
  } else if (meta?.kind === "reference") {
    const id = z.string().regex(UUID, "Not an entry id");
    if (meta.many) {
      const max = meta.max;
      let ids = z.array(id).refine((list) => new Set(list).size === list.length, { message: "An entry is picked twice" });
      if (max) ids = ids.refine((list) => list.length <= max, { message: `At most ${max} entries` });
      strict = meta.required ? ids.refine((list) => list.length > 0, { message: "Required" }) : ids.optional();
    } else strict = meta.required ? id : id.nullable().optional();
  } else if (meta?.kind === "link") {
    const types = meta.types;
    const entry = z.strictObject({
      kind: z.literal("entry"),
      type: z.string().refine((type) => !types || types.includes(type), { message: "This content type can't be linked here" }),
      entryId: z.string().regex(UUID, "Not an entry id"),
    });
    const href = z
      .string()
      .refine((value) => value === "" || SAFE_HREF.test(value), { message: "Use a path (/about), an #anchor, or an https://, mailto: or tel: address" });
    const url = z.strictObject({
      kind: z.literal("url"),
      href: meta.required ? href.refine((value) => value.trim() !== "", { message: "Required" }) : href,
    });
    // A bare string is the older shape of a URL link (stored before link fields): still accepted.
    const legacy = (meta.required ? href.refine((value) => value.trim() !== "", { message: "Required" }) : href) as z.ZodType;
    const union = z.union([z.discriminatedUnion("kind", [entry, url]), legacy]);
    strict = meta.required ? union : union.optional();
  } else if (meta?.kind === "blocks") {
    strict = meta.strict();
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
