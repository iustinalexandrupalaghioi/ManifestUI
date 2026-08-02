import { pgTable, pgPolicy, text, uuid, boolean, timestamp } from "drizzle-orm/pg-core";

// Mirrors Supabase auth.users, kept in sync via Database Webhooks hitting
// src/app/api/webhooks/auth-users/route.ts — see that file for what's
// written and when. `id` is never generated here; it's always set
// explicitly from auth.users.id by the webhook handler.
export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey(),
    full_name: text(),
    email: text(),
    phone: text(),
    // Local-only — never synced from auth.users, editable through this app.
    administrator: boolean().default(false).notNull(),
    banned_until: timestamp({ withTimezone: true, mode: "string" }),
    created_at: timestamp({
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updated_at: timestamp({
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  () => [
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ],
);
