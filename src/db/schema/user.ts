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
    fullName: text(),
    email: text(),
    phone: text(),
    avatarUrl: text(),
    avatarPath: text(),
    administrator: boolean().default(false).notNull(),
    bannedUntil: timestamp({ withTimezone: true, mode: "string" }),
    lastSignInAt: timestamp({ withTimezone: true, mode: "string" }),
    createdAt: timestamp({
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp({
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
