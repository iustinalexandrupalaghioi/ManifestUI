import { sql } from "drizzle-orm";
import { pgTable, pgPolicy, text, bigint, uuid, timestamp, unique, check, jsonb } from "drizzle-orm/pg-core";

/**
 * Marketing-site pages edited in the CMS: one row per page and locale. A
 * "text" page has a Markdown body (legal pages); a "sections" page is built
 * from sections whose texts are stored in `sections` (the home page, slug
 * "home"). The site serves /<locale>/<slug> from the published row only.
 */
export const sitePage = pgTable(
  "site_page",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "site_page_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    slug: text().notNull(),
    locale: text().notNull(),
    title: text().notNull(),
    description: text().notNull().default(""),
    kind: text().notNull().default("text"),
    body: text().notNull().default(""),
    /** Blocks of a "sections" page ({ id, type, hidden?, content }); each type's fields are its defineBlock in src/content/blocks. */
    sections: jsonb().notNull().default([]),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull().defaultNow(),
    /** The same for every locale of one entry (content layer, references, links). */
    entryId: uuid().notNull().defaultRandom(),
    /** When the row went live; null = not live. Replaces `published` (kept until every reader moved). */
    publishedAt: timestamp({ withTimezone: true, mode: "string" }),
    /** Who published it (auth user id; not a foreign key, so deleting a user keeps the history). */
    publishedBy: uuid(),
  },
  (table) => [
    // Also the index for the page lookup (slug + locale).
    unique("site_page_slug_locale_key").on(table.slug, table.locale),
    // One row per locale of an entry; also the index for entry lookups.
    unique("site_page_entry_id_locale_key").on(table.entryId, table.locale),
    check("site_page_locale_check", sql`locale = ANY (ARRAY['en'::text, 'ro'::text])`),
    check("site_page_kind_check", sql`kind = ANY (ARRAY['text'::text, 'sections'::text])`),
    check("site_page_slug_check", sql`slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    // The app reads through its server connection; this only governs
    // Supabase's public API, where published pages are public anyway.
    pgPolicy("Published site pages are readable by everyone", {
      as: "permissive",
      for: "select",
      to: ["anon", "authenticated"],
      using: sql`published_at IS NOT NULL`,
    }),
  ],
);
