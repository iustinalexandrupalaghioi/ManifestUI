import { sql } from "drizzle-orm";
import { pgTable, pgPolicy, text, bigint, boolean, integer, timestamp, unique, check, jsonb } from "drizzle-orm/pg-core";

/**
 * Services shown on the website (the "services" collection), edited in the
 * CMS (Website › Services): one row per service and locale. `image` is a
 * public site image ({ src, width, height } in the site-media bucket).
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
    published: boolean().notNull().default(false),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    // Also the index for looking a service up by address.
    unique("service_slug_locale_key").on(table.slug, table.locale),
    check("service_locale_check", sql`locale = ANY (ARRAY['en'::text, 'ro'::text])`),
    check("service_slug_check", sql`slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    // The app reads through its server connection; this only governs
    // Supabase's public API, where published services are public anyway.
    pgPolicy("Published services are readable by everyone", {
      as: "permissive",
      for: "select",
      to: ["anon", "authenticated"],
      using: sql`published`,
    }),
  ],
);
