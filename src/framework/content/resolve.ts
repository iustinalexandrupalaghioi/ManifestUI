/**
 * Turning stored fields into what a reader gets: hidden and unknown blocks
 * left out, references replaced by the entries they point to, entry links by
 * their current address. Pure: the content layer (./server/read.ts) fetches
 * the referenced entries and passes them in.
 */
import type { z } from "zod";
import { readBlocks, type AnyBlockDef } from "./blocks";
import { fieldMeta, shapeOf, type EntryRef, type LinkValue } from "./fields";

/** A referenced entry: published, in the reader's locale. Its own references aren't resolved (one level deep). */
export interface ResolvedEntry {
  type: string;
  entryId: string;
  locale: string;
  slug: string | null;
  /** Its public address, or null when its type has no `url`. */
  url: string | null;
  /** Its title field, or "". */
  title: string;
  data: Record<string, unknown>;
}

/** A link with its address worked out; an entry link whose entry isn't published has `href: ""`. */
export type ResolvedLink = { kind: "url"; href: string } | { kind: "entry"; type: string; entryId: string; href: string; title: string };

/** A stored value's shape after resolving: references become entries, links get their address. */
export type Resolved<T> = T extends EntryRef
  ? ResolvedEntry
  : T extends LinkValue
    ? ResolvedLink
    : T extends readonly (infer I)[]
      ? Resolved<I>[]
      : T extends object
        ? { [K in keyof T]: Resolved<T[K]> }
        : T;

export interface ResolveHooks {
  /** The entry an id points to, or undefined when it isn't available (dropped). */
  entry: (type: string, entryId: string) => ResolvedEntry | undefined;
  onUnknownBlock?: (type: string, id: string) => void;
}

/** Walks `value` by `schema`, applying the hooks at references, links and blocks. */
function walk(schema: z.ZodType, value: unknown, hooks: ResolveHooks): unknown {
  const meta = fieldMeta(schema);
  if (meta?.kind === "reference") {
    if (meta.many) return (Array.isArray(value) ? value : []).flatMap((id) => hooks.entry(meta.to, id) ?? []);
    return typeof value === "string" ? (hooks.entry(meta.to, value) ?? null) : null;
  }
  if (meta?.kind === "link") {
    const link = value as LinkValue;
    if (link?.kind !== "entry") return { kind: "url", href: (link as { href?: string })?.href ?? "" };
    const entry = hooks.entry(link.type, link.entryId);
    return { kind: "entry", type: link.type, entryId: link.entryId, href: entry?.url ?? "", title: entry?.title ?? "" };
  }
  if (meta?.kind === "blocks") {
    const defs = meta.blocks() as readonly AnyBlockDef[];
    return readBlocks(value, defs, { onUnknown: hooks.onUnknownBlock }).map((block) => ({
      ...block,
      content: walk(defs.find((def) => def.type === block.type)!.fields, block.content, hooks),
    }));
  }
  if (meta?.kind === "list") return Array.isArray(value) ? value.map((item) => walk(meta.item, item, hooks)) : value;
  const shape = shapeOf(schema);
  if (shape && value && typeof value === "object" && !Array.isArray(value))
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape[key] ? walk(shape[key], item, hooks) : item]));
  return value;
}

/** Resolves parsed fields (the output of the type's `fields` schema). */
export function resolveFields<T>(schema: z.ZodType<T, unknown>, value: T, hooks: ResolveHooks): Resolved<T> {
  return walk(schema, value, hooks) as Resolved<T>;
}

/** Every entry the fields point to, by content type: what to fetch before resolving. */
export function collectEntryRefs(schema: z.ZodType, value: unknown): Map<string, Set<string>> {
  const refs = new Map<string, Set<string>>();
  walk(schema, value, {
    entry: (type, entryId) => {
      refs.set(type, (refs.get(type) ?? new Set()).add(entryId));
      return undefined;
    },
    onUnknownBlock: () => {},
  });
  return refs;
}

/**
 * The content types a schema can point to (references, entry links), for
 * cache tags: a page showing a lesson must refresh when the lesson changes.
 * Links that may point to any type return `"*"`.
 */
export function referencedTypes(schema: z.ZodType, seen = new Set<z.ZodType>()): Set<string> {
  const types = new Set<string>();
  if (seen.has(schema)) return types;
  seen.add(schema);
  const add = (more: Iterable<string>) => {
    for (const type of more) types.add(type);
  };
  const meta = fieldMeta(schema);
  if (meta?.kind === "reference") types.add(meta.to);
  else if (meta?.kind === "link") add(meta.types ?? ["*"]);
  else if (meta?.kind === "blocks") for (const def of meta.blocks()) add(referencedTypes(def.fields, seen));
  else if (meta?.kind === "list") add(referencedTypes(meta.item, seen));
  else for (const field of Object.values(shapeOf(schema) ?? {})) add(referencedTypes(field, seen));
  return types;
}
