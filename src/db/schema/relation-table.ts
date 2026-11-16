import { pgTable, text, bigint, integer, date, numeric, timestamp, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Demo/seed data (dummyjson-style) — the entity todos relate to. Renamed
// from "users" so that name could be freed up for the real, auth-synced
// users table (see ./user.ts).
// Row-level security is on with no policies: Supabase's public API can't read or
// change these rows. The app reads and writes them through its server connection.
export const relation = pgTable(
  "relation",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "relation_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    first_name: text().default("").notNull(),
    last_name: text().default("").notNull(),
    maiden_name: text().default(""),
    age: integer().default(0),
    gender: text().default(""),
    email: text().default("").notNull(),
    phone: text().default(""),
    username: text().default("").notNull(),
    birth_date: date(),
    image: text().default(""),
    blood_group: text().default(""),
    height: numeric({ precision: 5, scale: 2 }).default("0"),
    weight: numeric({ precision: 5, scale: 2 }).default("0"),
    eye_color: text().default(""),
    hair_color: text().default(""),
    hair_type: text().default(""),
    created_at: timestamp({
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("relation_email_key").on(table.email),
    unique("relation_username_key").on(table.username),
    check(
      "relation_gender_check",
      sql`gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])`,
    ),
  ],
).enableRLS();
