import { sql } from "drizzle-orm";
import { pgTable, bigint, text, timestamp, uuid, unique, check } from "drizzle-orm/pg-core";

/**
 * Site-wide details (Single entries › Site info): one row per locale, all
 * the same entry. The website reads it through the content layer (the
 * "siteInfo" single entry), which uses the starter values until a row is
 * published. RLS is on with no policies: only the server connection reads it.
 */
export const siteInfo = pgTable(
  "site_info",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "site_info_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    locale: text().notNull(),
    siteName: text().notNull().default(""),
    /** The default search engine description, for pages without their own. */
    description: text().notNull().default(""),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull().defaultNow(),
    entryId: uuid().notNull().defaultRandom(),
    publishedAt: timestamp({ withTimezone: true, mode: "string" }),
    publishedBy: uuid(),
  },
  (table) => [
    unique("site_info_locale_key").on(table.locale),
    unique("site_info_entry_id_locale_key").on(table.entryId, table.locale),
    check("site_info_locale_check", sql`locale = ANY (ARRAY['en'::text, 'ro'::text])`),
  ],
).enableRLS();
