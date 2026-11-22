import { sql } from "drizzle-orm";
import { pgTable, pgPolicy, text, bigint, integer, uuid, timestamp, unique, check, jsonb } from "drizzle-orm/pg-core";

/**
 * Services: a content type (src/content/types/service.ts) edited in the CMS (Content › Services)
 * and shown on the website by the services block and at /<locale>/services/<slug>. One row per
 * service and locale; `image` is a public site image ({ src, width, height } in the site-media
 * bucket). The site reads the published rows only.
 */
export const service = pgTable(
  "service",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "service_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    slug: text().notNull(),
    locale: text().notNull(),
    title: text().notNull(),
    summary: text().notNull().default(""),
    body: text().notNull().default(""),
    image: jsonb().notNull().default({ src: "", width: 0, height: 0 }),
    position: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull().defaultNow(),
    /** The same for every locale of one entry (content layer, references, links). */
    entryId: uuid().notNull().defaultRandom(),
    /** When the row went live; null = not live. */
    publishedAt: timestamp({ withTimezone: true, mode: "string" }),
    /** Who published it (auth user id; not a foreign key, so deleting a user keeps the history). */
    publishedBy: uuid(),
  },
  (table) => [
    // Also the index for looking a service up by address.
    unique("service_slug_locale_key").on(table.slug, table.locale),
    // One row per locale of an entry; also the index for entry lookups.
    unique("service_entry_id_locale_key").on(table.entryId, table.locale),
    check("service_locale_check", sql`locale = ANY (ARRAY['en'::text, 'ro'::text])`),
    check("service_slug_check", sql`slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    // The app reads through its server connection; this only governs
    // Supabase's public API, where published services are public anyway.
    pgPolicy("Published services are readable by everyone", {
      as: "permissive",
      for: "select",
      to: ["anon", "authenticated"],
      using: sql`published_at IS NOT NULL`,
    }),
  ],
);
