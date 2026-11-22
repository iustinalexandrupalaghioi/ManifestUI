/**
 * Content types: a CMS resource that is also content (drafts, publishing,
 * optional localization, read through the content layer).
 *
 * The resource descriptor carries the options (`descriptor.content`); this
 * definition binds them to the table and the editable fields. Keep content
 * definitions free of React: they're read on the server by the content layer
 * and the publish actions.
 */
import type { z } from "zod";
import { getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import type { ContentOptions } from "./options";

/** A content type's editable fields: an object built from the field helpers. */
export type ContentFields = z.ZodObject<Record<string, z.ZodType>>;

type DeepPartial<T> = T extends readonly (infer I)[] ? DeepPartial<I>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export type ContentDescriptor = ResourceDescriptor & { content: ContentOptions };

export interface ContentTypeDef<F extends ContentFields = ContentFields, T extends PgTable = PgTable, N extends string = string> {
  /** The type's name, the same as `descriptor.content.type`; typed reads use it (`getEntry("page", …)`). */
  name: N;
  descriptor: ContentDescriptor;
  table: T;
  /**
   * Every editable field of an entry (what drafts and revisions store). Keys
   * are table properties, or keys inside `jsonColumn` when it's set.
   */
  fields: F;
  /** A jsonb table property that holds all the fields (e.g. `site_settings.content`). */
  jsonColumn?: string;
  /**
   * What a save or publish must satisfy, over the same keys as `fields`
   * (usually the resource's form schema without its row-only keys).
   * Defaults to the strict version of `fields` (see strictSchema).
   */
  schema?: z.ZodType;
  /** A new entry's fields per locale ("en" is the fallback), parsed with `fields`; singletons create their rows from these. */
  defaults?: Partial<Record<string, DeepPartial<z.input<F>>>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyContentType = ContentTypeDef<any, any, string>;

/** Columns every content table has (camelCase table properties). */
export const CONTENT_COLUMNS = ["entryId", "publishedAt", "publishedBy"] as const;

/**
 * Declares a content type. Checks the table and fields against the options
 * up front, so a misconfigured type fails when it's loaded, not on publish.
 */
export function defineContentType<const N extends string, F extends ContentFields, T extends PgTable>(
  def: Omit<ContentTypeDef<F, T, N>, "descriptor"> & { descriptor: ResourceDescriptor },
): ContentTypeDef<F, T, N> {
  const options = def.descriptor.content;
  if (!options) throw new Error(`Resource "${def.descriptor.id}" has no \`content\` options; add them to its descriptor.`);
  const columns = getTableColumns(def.table) as Record<string, unknown>;
  const where = `Content type "${def.name}" (${def.descriptor.table})`;
  if (options.type !== def.name) throw new Error(`${where}: its descriptor says content type "${options.type}".`);
  const required = [...CONTENT_COLUMNS, ...(options.localized ? ["locale"] : []), ...(def.jsonColumn ? [def.jsonColumn] : [])];
  for (const column of required)
    if (!(column in columns)) throw new Error(`${where}: its table has no "${column}" column.`);
  const shape = def.fields.shape;
  for (const field of [options.slugField, def.jsonColumn ? undefined : options.titleField]) {
    if (field && !(field in shape)) throw new Error(`${where}: "${field}" isn't one of its fields.`);
  }
  if (!def.jsonColumn)
    for (const field of Object.keys(shape))
      if (!(field in columns)) throw new Error(`${where}: field "${field}" has no column in its table (or set \`jsonColumn\`).`);
  if (options.kind === "singleton" && options.slugField) throw new Error(`${where}: a singleton has no slug.`);
  return { ...def, descriptor: def.descriptor as ContentDescriptor };
}

const registry = new Map<string, AnyContentType>();

/** Registers the project's content types (src/content/index.ts). */
export function registerContentTypes<const T extends readonly AnyContentType[]>(defs: T): T {
  for (const def of defs) {
    const existing = registry.get(def.name);
    if (existing && existing !== def) throw new Error(`Content type "${def.name}" is registered twice.`);
    registry.set(def.name, def);
  }
  return defs;
}

export const getContentType = (name: string) => registry.get(name);
export const listContentTypes = () => [...registry.values()];
export const contentTypeForResource = (resourceId: string) => listContentTypes().find((def) => def.descriptor.id === resourceId);
