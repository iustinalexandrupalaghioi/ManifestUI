import "server-only";

/**
 * Server-only part of the site module: data loaders for sections that need
 * more than their stored content (database records, generated code…).
 */
import { and, asc, eq, getTableColumns, type AnyColumn, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { getDbClient } from "@/framework/lib/dbClient";
import { cachedRead, collectionTag } from "./cache";

export { cachedRead, refreshCollection } from "./cache";
import type { CollectionCard, CollectionDef } from "./collections";
import type { SectionDef } from "./sections/define";

// ─────────────────────────────────────────────
// Collections
// ─────────────────────────────────────────────

export interface CollectionSource {
  name: string;
  /** The collection's published items in `locale`, as cards (cached until a record is saved). */
  load: (context: SectionLoadContext) => Promise<CollectionCard[]>;
}

/**
 * Where a collection's items come from: a table (a CMS resource's), which
 * rows are published, their language and order, and how a row becomes a
 * card. Reads are cached under the collection's tag; call
 * `refreshCollection(name)` (from this file) after the
 * resource's saves commit, so pages show changes within seconds.
 */
export function defineCollectionSource<TTable extends PgTable>(
  collection: CollectionDef,
  options: {
    table: TTable;
    /** A boolean column: only rows where it's true reach the site. */
    published?: AnyColumn;
    /** A text column with the row's locale; without it every row shows in every language. */
    locale?: AnyColumn;
    order?: AnyColumn;
    card: (row: TTable["$inferSelect"]) => CollectionCard;
  },
): CollectionSource {
  const read = async (locale: string) => {
    const filters = [options.published && eq(options.published, true), options.locale && eq(options.locale, locale)].filter(
      (filter): filter is SQL => !!filter,
    );
    const rows = await getDbClient()
      .select(getTableColumns(options.table))
      .from(options.table as PgTable)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(...(options.order ? [asc(options.order)] : []));
    return (rows as TTable["$inferSelect"][]).map(options.card);
  };
  return {
    name: collection.name,
    load: async ({ locale }) => {
      try {
        return await cachedRead(["collection", collection.name, locale], [collectionTag(collection.name)], () => read(locale));
      } catch (error) {
        // CI builds have no database; at runtime the error surfaces.
        if (process.env.NEXT_PHASE === "phase-production-build") return [];
        throw error;
      }
    },
  };
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
