import {
  pgTable,
  foreignKey,
  pgPolicy,
  bigint,
  timestamp,
  text,
  smallint,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { todo } from "./todo";

export const todo_attachment = pgTable(
  "todo_attachment",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "todo_attachment_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    created_at: timestamp({ withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    path: text().default("").notNull(),
    todo_id: smallint()
      .default(sql`'0'`)
      .notNull(),
    filename: text().default("").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.todo_id],
      foreignColumns: [todo.id],
      name: "todo_attachment_todo_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    pgPolicy("Enable delete to all users", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`true`,
    }),
    pgPolicy("Enable insert to all users", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("Enable read to all users", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Enable update to all users", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);
