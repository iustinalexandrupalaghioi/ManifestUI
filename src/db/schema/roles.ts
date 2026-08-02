import { pgTable, pgPolicy, text, bigint, timestamp, unique } from "drizzle-orm/pg-core";

export const roles = pgTable(
  "roles",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "roles_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    name: text().notNull(),
    description: text().default(""),
    created_at: timestamp({
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("roles_name_key").on(table.name),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ],
);
