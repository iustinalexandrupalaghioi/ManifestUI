import { sql } from "drizzle-orm";
import { pgTable, pgPolicy, text, bigint, uuid, timestamp, unique, check, jsonb } from "drizzle-orm/pg-core";

/**
 * Site-wide settings edited in the CMS (Website > Site settings): one row per
 * locale. `content` holds the header and footer ({ header, footer }), each
 * shaped by the navigation blocks in src/content/blocks/navigation.ts.
 */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "site_settings_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    locale: text().notNull(),
    content: jsonb().notNull().default({}),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull().defaultNow(),
    /** The same for every locale of one entry (content layer, references, links). */
    entryId: uuid().notNull().defaultRandom(),
    /** When the row went live; null = not live. Replaces `published` (kept until every reader moved). */
    publishedAt: timestamp({ withTimezone: true, mode: "string" }),
    /** Who published it (auth user id; not a foreign key, so deleting a user keeps the history). */
    publishedBy: uuid(),
  },
  (table) => [
    // One record per locale; also the index for the lookup.
    unique("site_settings_locale_key").on(table.locale),
    unique("site_settings_entry_id_locale_key").on(table.entryId, table.locale),
    check("site_settings_locale_check", sql`locale = ANY (ARRAY['en'::text, 'ro'::text])`),
    // The app reads through its server connection; this only governs
    // Supabase's public API, where the header and footer are public anyway.
    pgPolicy("Site settings are readable by everyone", {
      as: "permissive",
      for: "select",
      to: ["anon", "authenticated"],
      // Every row (locale is NOT NULL). A bare `true` is dropped by drizzle-kit,
      // and a SELECT policy without a condition would let no rows through.
      using: sql`locale IS NOT NULL`,
    }),
  ],
);
