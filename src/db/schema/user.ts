import {
  pgTable,
  pgPolicy,
  text,
  uuid,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable(
  "user",
  {
    id: uuid().primaryKey(),
    full_name: text(),
    email: text(),
    phone: text(),
    avatar_url: text(),
    avatar_path: text(),
    administrator: boolean().default(false).notNull(),
    banned_until: timestamp({ withTimezone: true, mode: "string" }),
    last_sign_in_at: timestamp({ withTimezone: true, mode: "string" }),
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
