import {
  pgTable,
  foreignKey,
  pgPolicy,
  smallint,
  text,
  boolean,
  timestamp,
  bigint,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relation } from "./relation-table";

export const todo = pgTable(
  "todo",
  {
    id: smallint().primaryKey().generatedByDefaultAsIdentity({
      name: "todo_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 32767,
      cache: 1,
    }),
    title: text().default("").notNull(),
    completed: boolean().default(false),
    created_at: timestamp({ withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    user_id: bigint({ mode: "number" })
      .default(sql`'0'`)
      .notNull(),
    notes: text().default("").notNull(),
    due_date: date(),
  },
  (table) => [
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [relation.id],
      name: "todo_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    pgPolicy("Enable delete for users based on user_id", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`true`,
    }),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("Enable read access for all users", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Enable update for authenticated users only", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);
