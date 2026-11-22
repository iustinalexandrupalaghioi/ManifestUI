/**
 * Blocks: reusable, named groups of fields (`hero`, `faq`) with no React in
 * them, and the `blocks()` field that holds an ordered list of them.
 *
 * Stored as jsonb: `[{ id, type, hidden?, content }]`, the same shape as the
 * website builder's sections, so existing page data needs no rewrite.
 *
 * - Form values keep every block, including unknown types (a block whose
 *   definition was removed), so saving a page never loses content.
 * - Reads (`readBlocks`) leave out hidden and unknown blocks.
 * - Saves (`validateBlocks`) check known blocks strictly; unknown ones are
 *   kept as they are.
 *
 * Client-safe and React-free: used by content definitions, the CMS form, the
 * content layer and the preview frame.
 */
import { z } from "zod";
import type { TranslatableText } from "@/framework/types/i18n-types";
import { fieldMeta, strictSchema, tagField } from "./fields";

/** A block's fields: an object built from the field helpers. */
export type BlockFields = z.ZodObject<Record<string, z.ZodType>>;

type DeepPartial<T> = T extends readonly (infer I)[] ? DeepPartial<I>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export interface BlockDef<TType extends string = string, F extends BlockFields = BlockFields> {
  /** Stored in each block's `type`; unique, and never renamed once content uses it. */
  type: TType;
  label: TranslatableText;
  /** Shown in the Add block picker. */
  description?: TranslatableText;
  fields: F;
  /** Content of a newly added block, per locale ("en" is the fallback). */
  defaults?: Partial<Record<string, DeepPartial<z.output<F>>>>;
  /** The text field shown as the block's summary in the editor; defaults to the first text field. */
  titleField?: keyof z.output<F> & string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBlockDef = BlockDef<string, any>;

/** Declares a block. Keep block files free of React: renderers live with the frontend. */
export function defineBlock<const TType extends string, F extends BlockFields>(def: BlockDef<TType, F>): BlockDef<TType, F> {
  return def;
}

/** One stored block. */
export interface StoredBlock {
  id: string;
  type: string;
  hidden?: boolean;
  content: unknown;
}

/** A parsed block of a known type: `type` narrows `content`. */
export type BlockOf<B extends AnyBlockDef> = B extends BlockDef<infer T, infer F>
  ? { id: string; type: T; hidden?: boolean; content: z.output<F> }
  : never;

/** Block ids: safe inside field paths (`body[b_x7k2].title`). */
export const BLOCK_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** A new block id: "b_" and 6 random characters. */
export function newBlockId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  return `b_${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

/** A block's content parsed leniently: broken values fall back to empty ones, never throw. */
export function parseBlockContent<F extends BlockFields>(def: BlockDef<string, F>, content: unknown): z.output<F> {
  const parsed = def.fields.safeParse(content && typeof content === "object" && !Array.isArray(content) ? content : {});
  return parsed.success ? parsed.data : def.fields.parse({});
}

/** Content for a new block of this type, from its defaults for `locale`. */
export function newBlockContent<F extends BlockFields>(def: BlockDef<string, F>, locale = "en"): z.output<F> {
  return parseBlockContent(def, def.defaults?.[locale] ?? def.defaults?.en ?? {});
}

/** A new block, prefilled from the block's defaults for `locale`. */
export function newBlock(def: AnyBlockDef, locale = "en"): StoredBlock {
  return { id: newBlockId(), type: def.type, content: newBlockContent(def, locale) };
}

const byType = (defs: readonly AnyBlockDef[]) => new Map(defs.map((def) => [def.type, def]));

/** `base` + `suffix`, `base` cut so the id fits BLOCK_ID (64 characters). */
const withSuffix = (base: string, suffix: string) => `${base.slice(0, 64 - suffix.length)}${suffix}`;

/**
 * Parses a stored blocks value for editing: known blocks get their content
 * parsed, unknown ones are kept untouched (`content` as stored). Missing or
 * duplicate ids are replaced, so every block has a unique, path-safe id.
 */
export function parseBlocks(value: unknown, defs: readonly AnyBlockDef[]): StoredBlock[] {
  if (!Array.isArray(value)) return [];
  const known = byType(defs);
  const seen = new Set<string>();
  return value.flatMap((raw, index): StoredBlock[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const record = raw as Record<string, unknown>;
    const type = typeof record.type === "string" ? record.type : "";
    if (!type) return [];
    // Fallback ids stay deterministic (the same stored value gives the same ids) and within BLOCK_ID's 64 characters.
    const base = typeof record.id === "string" && BLOCK_ID.test(record.id) ? record.id : withSuffix(type.replace(/[^A-Za-z0-9_-]/g, "") || "block", `-${index}`);
    let id = base;
    for (let n = 1; seen.has(id); n++) id = withSuffix(base, `-${index}-${n}`);
    seen.add(id);
    const def = known.get(type);
    const block: StoredBlock = { id, type, content: def ? parseBlockContent(def, record.content) : record.content };
    if (record.hidden === true) block.hidden = true;
    return [block];
  });
}

/**
 * Blocks for a reader: known, visible blocks only, content parsed. Unknown
 * types are reported through `onUnknown` (logged by default) and left out.
 */
export function readBlocks<const D extends readonly AnyBlockDef[]>(
  value: unknown,
  defs: D,
  options: { onUnknown?: (type: string, id: string) => void } = {},
): BlockOf<D[number]>[] {
  const known = byType(defs);
  const onUnknown = options.onUnknown ?? ((type: string, id: string) => console.warn(`[content] unknown block type "${type}" (block ${id}) left out`));
  return parseBlocks(value, defs).flatMap((block) => {
    if (!known.has(block.type)) {
      onUnknown(block.type, block.id);
      return [];
    }
    return block.hidden ? [] : [block as BlockOf<D[number]>];
  });
}

/** A problem in submitted blocks; `path` starts at the blocks array ([2, "content", "items", 0, "q"]). */
export interface BlockIssue {
  path: (string | number)[];
  message: string;
}

/**
 * Checks blocks before they're saved: the list shape and size, unique
 * path-safe ids, and each known block's content against its strict schema (no
 * unknown keys or wrong types; text constraints apply). Blocks of types not
 * offered here are kept as stored, provided their shape is sound.
 */
export function validateBlocks(value: unknown, defs: readonly AnyBlockDef[], options: { min?: number; max?: number } = {}): BlockIssue[] {
  if (!Array.isArray(value)) return [{ path: [], message: "Blocks must be a list" }];
  const issues: BlockIssue[] = [];
  if (options.min !== undefined && value.length < options.min) issues.push({ path: [], message: `At least ${options.min} blocks` });
  if (options.max !== undefined && value.length > options.max) issues.push({ path: [], message: `At most ${options.max} blocks` });
  const known = byType(defs);
  const ids = new Set<string>();
  value.forEach((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      issues.push({ path: [index], message: "Each block must be an object" });
      return;
    }
    const { id, type, hidden, content, ...rest } = raw as Record<string, unknown>;
    for (const key of Object.keys(rest)) issues.push({ path: [index, key], message: `Unknown key "${key}"` });
    if (typeof id !== "string" || !BLOCK_ID.test(id)) issues.push({ path: [index, "id"], message: "Block id must be letters, digits, _ or -" });
    else if (ids.has(id)) issues.push({ path: [index, "id"], message: `Duplicate block id "${id}"` });
    else ids.add(id);
    if (hidden !== undefined && typeof hidden !== "boolean") issues.push({ path: [index, "hidden"], message: "Expected true or false" });
    if (typeof type !== "string" || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(type)) {
      issues.push({ path: [index, "type"], message: "Block type is required" });
      return;
    }
    const def = known.get(type);
    if (!def) {
      if (content !== undefined && (typeof content !== "object" || content === null || Array.isArray(content)))
        issues.push({ path: [index, "content"], message: "Block content must be an object" });
      return;
    }
    const result = strictSchema(def.fields).safeParse(content ?? {});
    if (!result.success)
      for (const issue of result.error.issues)
        issues.push({ path: [index, "content", ...issue.path.map((key) => (typeof key === "symbol" ? String(key) : key))], message: issue.message });
  });
  return issues;
}

/**
 * A blocks field: an ordered list of blocks chosen from `defs`. Reads
 * leniently (see parseBlocks); its save-time schema is validateBlocks.
 */
export function blocks<const D extends readonly AnyBlockDef[]>(
  defs: D,
  options: { label?: TranslatableText; min?: number; max?: number } = {},
): z.ZodType<BlockOf<D[number]>[], unknown> {
  // Optional before the check: a missing key reads as no blocks.
  const strict = z.unknown().optional().superRefine((value, ctx) => {
    if (value === undefined) return;
    for (const issue of validateBlocks(value, defs, options)) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
  });
  // Typed as the allowed blocks: unknown ones are kept for editing but never reach readers (readBlocks).
  return tagField(z.unknown().optional().transform((value) => parseBlocks(value, defs) as BlockOf<D[number]>[]) as z.ZodType<BlockOf<D[number]>[], unknown>, {
    kind: "blocks",
    label: options.label,
    blocks: () => defs,
    min: options.min,
    max: options.max,
    strict: () => strict,
  });
}

/** The blocks a `blocks()` field allows, or undefined when `schema` isn't one. */
export function allowedBlocks(schema: z.ZodType): readonly AnyBlockDef[] | undefined {
  const meta = fieldMeta(schema);
  return meta?.kind === "blocks" ? (meta.blocks() as readonly AnyBlockDef[]) : undefined;
}

/** The text shown for a block in the editor: its title field, or its first non-empty text field. */
export function blockSummary(def: AnyBlockDef | undefined, content: unknown): string {
  const record = content && typeof content === "object" ? (content as Record<string, unknown>) : {};
  if (def?.titleField && typeof record[def.titleField] === "string") return record[def.titleField] as string;
  const shape = def?.fields.shape ?? {};
  for (const [key, field] of Object.entries(shape)) {
    if (fieldMeta(field as z.ZodType)?.kind === "text" && typeof record[key] === "string" && record[key]) return record[key] as string;
  }
  return "";
}
