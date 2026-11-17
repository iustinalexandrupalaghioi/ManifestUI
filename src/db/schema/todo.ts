import { pgTable, foreignKey, smallint, text, boolean, timestamp, bigint, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relation } from "./relation-table";

// Row-level security is on with no policies: Supabase's public API can't read or
// change these rows. The app reads and writes them through its server connection.
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
  ],
).enableRLS();
