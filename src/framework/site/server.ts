import "server-only";

/**
 * Server-only part of the website builder: data loaders for sections that need
 * more than their stored content (database records, generated code…).
 */
import { and, asc, eq, getTableColumns, type AnyColumn, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { getDbClient } from "@/framework/lib/dbClient";
import { cachedRead, collectionTag, resourceTag } from "./cache";

export { cachedRead, refreshCollection, refreshResource } from "./cache";
import type { CollectionCard, CollectionDef } from "./collections";
import type { SectionDef } from "./sections/define";

// ─────────────────────────────────────────────
// Collections
// ─────────────────────────────────────────────

/** One collection item: its card and the whole row (read through the cache, so as JSON: dates are strings). */
export interface CollectionItem<TRow = Record<string, unknown>> {
  card: CollectionCard;
  row: CachedRow<TRow>;
}

/** A row as cached reads return it: JSON values, so dates become ISO strings. */
export type CachedRow<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K];
};

export interface CollectionSource {
  name: string;
  /** The collection's published items in `locale`, as cards (cached until a record is saved). */
  load: (context: SectionLoadContext) => Promise<CollectionCard[]>;
  /**
   * One published item in `locale` whose `column` (a table property, e.g. "slug") equals
   * `value`, or null. Cached with the same tags as `load`, so a CMS save refreshes it too.
   */
  find?: (context: SectionLoadContext, column: string, value: string) => Promise<CollectionItem | null>;
}

/**
 * Where a collection's items come from: a table (a CMS resource's), which
 * rows are published, their language and order, and how a row becomes a
 * card. Reads are cached under the collection's tag and, with `resource`,
 * the CMS resource's tag: the CMS refreshes that one whenever the resource's
 * saves commit, so pages show changes within seconds. Without `resource`,
 * call `refreshCollection(name)` (from this file) after saving the records.
 */
export function defineCollectionSource<TTable extends PgTable>(
  collection: CollectionDef,
  options: {
    table: TTable;
    /** The CMS resource (descriptor id) whose saves refresh this collection. */
    resource?: string;
    /** A boolean column: only rows where it's true reach the site. */
    published?: AnyColumn;
    /** A text column with the row's locale; without it every row shows in every language. */
    locale?: AnyColumn;
    order?: AnyColumn;
    card: (row: TTable["$inferSelect"]) => CollectionCard;
  },
): CollectionSource {
  const filtersFor = (locale: string) =>
    [options.published && eq(options.published, true), options.locale && eq(options.locale, locale)].filter(
      (filter): filter is SQL => !!filter,
    );
  const tags = [collectionTag(collection.name), ...(options.resource ? [resourceTag(options.resource)] : [])];
  const read = async (locale: string) => {
    const filters = filtersFor(locale);
    const rows = await getDbClient()
      .select(getTableColumns(options.table))
      .from(options.table as PgTable)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(...(options.order ? [asc(options.order)] : []));
    return (rows as TTable["$inferSelect"][]).map(options.card);
  };
  const readOne = async (locale: string, column: string, value: string): Promise<CollectionItem | null> => {
    const match = (getTableColumns(options.table) as Record<string, AnyColumn>)[column];
    if (!match) throw new Error(`Collection "${collection.name}": its table has no column "${column}".`);
    const rows = (await getDbClient()
      .select(getTableColumns(options.table))
      .from(options.table as PgTable)
      .where(and(eq(match, value), ...filtersFor(locale)))
      .limit(1)) as TTable["$inferSelect"][];
    const row = rows[0];
    return row ? { card: options.card(row), row: row as CollectionItem["row"] } : null;
  };
  // CI builds have no database: they render empty; at runtime the error surfaces.
  const duringBuild = () => process.env.NEXT_PHASE === "phase-production-build";
  return {
    name: collection.name,
    load: async ({ locale }) => {
      try {
        return await cachedRead(["collection", collection.name, locale], tags, () => read(locale));
      } catch (error) {
        if (duringBuild()) return [];
        throw error;
      }
    },
    find: async ({ locale }, column, value) => {
      try {
        return await cachedRead(["collection-item", collection.name, locale, column, value], tags, () =>
          readOne(locale, column, value),
        );
      } catch (error) {
        if (duringBuild()) return null;
        throw error;
      }
    },
  };
}

/**
 * One item of a collection for its own page (e.g. /projects/<slug>): published, in `locale`,
 * matched by a column such as its slug. Returns its card and its row, typed by `TRow`
 * (`typeof project.$inferSelect`), or null when there's no such item.
 */
export async function findCollectionItem<TRow = Record<string, unknown>>(
  sources: readonly CollectionSource[],
  name: string,
  context: SectionLoadContext,
  column: string,
  value: string,
): Promise<CollectionItem<TRow> | null> {
  const source = sources.find((item) => item.name === name);
  if (!source?.find) throw new Error(`No collection source named "${name}" (src/components/extensions/collections/data.ts).`);
  return (await source.find(context, column, value)) as CollectionItem<TRow> | null;
}

/** Loads every collection's cards for a locale, by collection name (each cached on its own). */
export function createCollectionLoader(sources: readonly CollectionSource[]) {
  return async (context: SectionLoadContext): Promise<Record<string, CollectionCard[]>> =>
    Object.fromEntries(await Promise.all(sources.map(async (source) => [source.name, await source.load(context)] as const)));
}

// ─────────────────────────────────────────────
// Section data loaders
// ─────────────────────────────────────────────

export interface SectionLoadContext {
  locale: string;
}

export interface SectionLoader {
  type: string;
  load: (context: SectionLoadContext) => unknown;
}

/** The server loader for a section declared with `data: sectionData<T>()`; its result is type-checked against T. */
export function defineSectionLoader<TData>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: SectionDef<string, any, TData>,
  load: (context: SectionLoadContext) => TData | Promise<TData>,
): SectionLoader {
  return { type: def.type, load };
}

/**
 * Builds the page's data loader: given the section types on a page, runs
 * their loaders (once per type, in parallel) and returns the results by type.
 */
export function createSectionDataLoader(loaders: readonly SectionLoader[]) {
  const byType = new Map(loaders.map((loader) => [loader.type, loader.load]));
  const load = async (types: Iterable<string>, context: SectionLoadContext): Promise<Record<string, unknown>> => {
    const wanted = [...new Set(types)].filter((type) => byType.has(type));
    const entries = await Promise.all(wanted.map(async (type) => [type, await byType.get(type)!(context)] as const));
    return Object.fromEntries(entries);
  };
  return Object.assign(load, {
    /** Data for every section type (the editor can add any of them). */
    all: (context: SectionLoadContext) => load(byType.keys(), context),
  });
}
