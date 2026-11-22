/**
 * The content layer: how app code reads content (§5).
 *
 *   getEntry(type, { slug | entryId, locale, draft?, fallbackLocale? })
 *   listEntries(type, { locale, where?, order?, limit?, cursor?, draft?, fallbackLocale? })
 *   getSingleton(type, { locale, draft? })
 *   listSlugs(type)   → [{ slug, locale }] of published entries, for generateStaticParams
 *
 * Published rows only, unless `draft: true` and draft mode is on: then the
 * draft wins where there is one, and nothing is cached. Results are parsed:
 * hidden and unknown blocks left out, references resolved to published
 * entries in the same locale (one level), entry links to their address.
 *
 * Every cached read is tagged with its type and the resource's tag (and the
 * entry's tag when read by id), plus the tags of every type it can point to,
 * so publishing any of them refreshes it. Storage, cache and draft mode are
 * injected (./content.server.ts wires the real ones).
 */
import type { z } from "zod";
import type { AnyContentType } from "../define";
import { entryUrl } from "../options";
import { collectEntryRefs, referencedTypes, resolveFields, type Resolved, type ResolvedEntry } from "../resolve";
import { contentTag, entryTag, resourceTag } from "../tags";
import type { EntryData, RowState } from "./store";

export interface RowQuery {
  /** Rows in these locales (localized types). */
  locales?: readonly string[];
  /** Only rows with published_at set. */
  publishedOnly: boolean;
  entryIds?: readonly string[];
  /** Field equals value (fields stored in their own columns). */
  equals?: Record<string, unknown>;
  order?: readonly { field: string; direction: "asc" | "desc" }[];
  limit?: number;
  offset?: number;
}

export interface ReadSource {
  rows(def: AnyContentType, query: RowQuery): Promise<RowState[]>;
  /** Drafts of these rows: row id → fields. */
  drafts(def: AnyContentType, rowIds: readonly string[]): Promise<Map<string, EntryData>>;
}

export interface ReaderDeps {
  source: ReadSource;
  types: readonly AnyContentType[];
  /** Caches `load` under `key` with `tags` (and the hourly safety net). */
  cache: <T>(key: string[], tags: string[], load: () => Promise<T>) => Promise<T>;
  /** Whether this request may read drafts of `def`: draft mode on and the viewer may read the type. */
  draftMode: (def: AnyContentType) => Promise<boolean>;
  onUnknownBlock?: (type: string, id: string) => void;
}

/** One entry as readers get it. */
export interface Entry<D = Record<string, unknown>> {
  type: string;
  entryId: string;
  rowId: string;
  /** The locale actually served (the fallback when the entry isn't translated). */
  locale: string;
  slug: string | null;
  url: string | null;
  publishedAt: string | null;
  /** True when this is draft data (draft mode). */
  draft: boolean;
  data: D;
}

export type EntryOf<T extends AnyContentType> = Entry<Resolved<z.output<T["fields"]>>>;

export interface Page<T> {
  items: T[];
  /** Pass back as `cursor` for the next page; null on the last page. */
  nextCursor: string | null;
}

export function createContentReader(deps: ReaderDeps) {
  const byName = new Map(deps.types.map((def) => [def.name, def]));
  const typeOrThrow = (name: string) => {
    const def = byName.get(name);
    if (!def) throw new Error(`No content type "${name}" (src/content/index.ts).`);
    return def;
  };

  /** The tags a read of this type carries: its own, and those of every type it can point to. */
  const tagsFor = (def: AnyContentType, extra: string[] = []) => {
    const pointsTo = referencedTypes(def.fields);
    // "*": a link that may point to any type with an address.
    const targets = [
      ...[...pointsTo].flatMap((name) => byName.get(name) ?? []),
      ...(pointsTo.has("*") ? deps.types.filter((type) => type.descriptor.content.url) : []),
    ];
    const tags = new Set([contentTag(def.name), resourceTag(def.descriptor.id), ...extra]);
    for (const target of targets) {
      tags.add(contentTag(target.name));
      tags.add(resourceTag(target.descriptor.id));
    }
    return [...tags];
  };

  const slugOf = (def: AnyContentType, data: EntryData) => {
    const field = def.descriptor.content.slugField;
    return field && typeof data[field] === "string" ? (data[field] as string) : null;
  };

  /** Fetches what `parsed` points to (published, in `locale`), one query per type. */
  async function entryLookup(def: AnyContentType, parsedList: unknown[], locale: string) {
    const wanted = new Map<string, Set<string>>();
    for (const parsed of parsedList)
      for (const [type, ids] of collectEntryRefs(def.fields, parsed)) wanted.set(type, new Set([...(wanted.get(type) ?? []), ...ids]));
    const found = new Map<string, ResolvedEntry>();
    await Promise.all(
      [...wanted].map(async ([name, ids]) => {
        const target = byName.get(name);
        if (!target) return;
        const rows = await deps.source.rows(target, {
          publishedOnly: true,
          entryIds: [...ids],
          locales: target.descriptor.content.localized ? [locale] : undefined,
        });
        for (const row of rows) {
          const data = target.fields.parse(row.data) as EntryData;
          const slug = slugOf(target, data);
          const titleField = target.descriptor.content.titleField;
          found.set(`${name}:${row.entryId}`, {
            type: name,
            entryId: row.entryId,
            locale: row.locale,
            slug,
            url: entryUrl(target.descriptor.content, { locale: row.locale, slug: slug ?? undefined }),
            title: titleField && typeof data[titleField] === "string" ? (data[titleField] as string) : "",
            data,
          });
        }
      }),
    );
    return (type: string, entryId: string) => found.get(`${type}:${entryId}`);
  }

  /** Rows → entries: drafts overlaid (draft mode), fields parsed and resolved. */
  async function toEntries(def: AnyContentType, rows: RowState[], draft: boolean, locale: string): Promise<Entry[]> {
    const drafts = draft && rows.length ? await deps.source.drafts(def, rows.map((row) => row.rowId)) : new Map<string, EntryData>();
    const parsed = rows.map((row) => def.fields.parse(drafts.get(row.rowId) ?? row.data) as EntryData);
    const lookup = await entryLookup(def, parsed, locale);
    return rows.map((row, index) => {
      const data = parsed[index];
      const slug = slugOf(def, data);
      return {
        type: def.name,
        entryId: row.entryId,
        rowId: row.rowId,
        locale: row.locale,
        slug,
        url: entryUrl(def.descriptor.content, { locale: row.locale, slug: slug ?? undefined }),
        publishedAt: row.publishedAt,
        draft: drafts.has(row.rowId),
        data: resolveFields(def.fields, data, { entry: lookup, onUnknownBlock: deps.onUnknownBlock }) as Record<string, unknown>,
      };
    });
  }

  /** Picks one row per entry: the requested locale, else the fallback. */
  const preferLocale = (rows: RowState[], locale: string) => {
    const byEntry = new Map<string, RowState>();
    for (const row of rows) {
      const existing = byEntry.get(row.entryId);
      if (!existing || row.locale === locale) byEntry.set(row.entryId, row);
    }
    return rows.filter((row) => byEntry.get(row.entryId) === row);
  };

  const localesFor = (def: AnyContentType, locale: string, fallback?: string) =>
    def.descriptor.content.localized ? [...new Set([locale, ...(fallback ? [fallback] : [])])] : undefined;

  /** Runs a read: cached unless it's a draft read in draft mode. */
  async function run<T>(def: AnyContentType, draftRequested: boolean | undefined, key: string[], tags: string[], load: (draft: boolean) => Promise<T>) {
    const draft = !!draftRequested && (await deps.draftMode(def));
    return draft ? load(true) : deps.cache(key, tags, () => load(false));
  }

  return {
    async getEntry(
      type: string,
      options: { locale: string; slug?: string; entryId?: string; draft?: boolean; fallbackLocale?: string },
    ): Promise<Entry | null> {
      const def = typeOrThrow(type);
      const slugField = def.descriptor.content.slugField;
      if (options.slug === undefined && options.entryId === undefined) throw new Error(`getEntry("${type}"): pass a slug or an entryId.`);
      if (options.slug !== undefined && !slugField) throw new Error(`getEntry("${type}"): this type has no slug field.`);
      const by = options.slug !== undefined ? `slug:${options.slug}` : `id:${options.entryId}`;
      const tags = tagsFor(def, options.entryId ? [entryTag(def.name, options.entryId)] : []);
      return run(def, options.draft, ["content", "entry", type, options.locale, by, options.fallbackLocale ?? ""], tags, async (draft) => {
        const rows = await deps.source.rows(def, {
          publishedOnly: !draft,
          locales: localesFor(def, options.locale, options.fallbackLocale),
          entryIds: options.entryId ? [options.entryId] : undefined,
          equals: options.slug !== undefined ? { [slugField!]: options.slug } : undefined,
        });
        const row = rows.find((item) => item.locale === options.locale) ?? rows[0];
        if (!row) return null;
        const [entry] = await toEntries(def, [row], draft, options.locale);
        return entry;
      });
    },

    async listEntries(
      type: string,
      options: {
        locale: string;
        where?: Record<string, unknown>;
        order?: readonly { field: string; direction?: "asc" | "desc" }[];
        limit?: number;
        cursor?: string | null;
        draft?: boolean;
        fallbackLocale?: string;
      },
    ): Promise<Page<Entry>> {
      const def = typeOrThrow(type);
      const offset = options.cursor ? Math.max(0, Number.parseInt(options.cursor, 10) || 0) : 0;
      const order = (options.order ?? []).map((rule) => ({ field: rule.field, direction: rule.direction ?? ("asc" as const) }));
      const key = ["content", "list", type, options.locale, JSON.stringify([options.where ?? {}, order, options.limit ?? null, offset, options.fallbackLocale ?? ""])];
      return run(def, options.draft, key, tagsFor(def), async (draft) => {
        const fallback = options.fallbackLocale && options.fallbackLocale !== options.locale;
        // With a fallback, rows are merged per entry before paging, so page in memory.
        const rows = await deps.source.rows(def, {
          publishedOnly: !draft,
          locales: localesFor(def, options.locale, options.fallbackLocale),
          equals: options.where,
          order,
          ...(fallback ? {} : { limit: options.limit !== undefined ? options.limit + 1 : undefined, offset }),
        });
        let picked = fallback ? preferLocale(rows, options.locale) : rows;
        if (fallback) picked = picked.slice(offset, options.limit !== undefined ? offset + options.limit + 1 : undefined);
        const more = options.limit !== undefined && picked.length > options.limit;
        const items = await toEntries(def, more ? picked.slice(0, options.limit) : picked, draft, options.locale);
        return { items, nextCursor: more ? String(offset + options.limit!) : null };
      });
    },

    /** The single entry in `locale`; its `defaults` while it has no published row (so the site never renders without it). */
    async getSingleton(type: string, options: { locale: string; draft?: boolean }): Promise<Entry | null> {
      const def = typeOrThrow(type);
      if (def.descriptor.content.kind !== "singleton") throw new Error(`getSingleton("${type}"): it isn't a singleton.`);
      return run(def, options.draft, ["content", "singleton", type, options.locale], tagsFor(def), async (draft) => {
        const rows = await deps.source.rows(def, { publishedOnly: !draft, locales: localesFor(def, options.locale) });
        if (rows[0]) return (await toEntries(def, [rows[0]], draft, options.locale))[0];
        const defaults = def.defaults?.[options.locale] ?? def.defaults?.en;
        if (!defaults) return null;
        const data = def.fields.parse(defaults) as EntryData;
        return {
          type: def.name,
          entryId: "",
          rowId: "",
          locale: options.locale,
          slug: null,
          url: null,
          publishedAt: null,
          draft: false,
          data: resolveFields(def.fields, data, { entry: () => undefined }) as Record<string, unknown>,
        };
      });
    },

    async listSlugs(type: string): Promise<{ slug: string; locale: string }[]> {
      const def = typeOrThrow(type);
      if (!def.descriptor.content.slugField) throw new Error(`listSlugs("${type}"): this type has no slug field.`);
      return deps.cache(["content", "slugs", type], tagsFor(def), async () => {
        const rows = await deps.source.rows(def, { publishedOnly: true });
        return rows.flatMap((row) => {
          const slug = slugOf(def, def.fields.parse(row.data) as EntryData);
          return slug ? [{ slug, locale: row.locale }] : [];
        });
      });
    },
  };
}

export type ContentReader = ReturnType<typeof createContentReader>;
