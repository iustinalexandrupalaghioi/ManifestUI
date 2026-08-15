import {
  pgTable,
  foreignKey,
  pgPolicy,
  uuid,
  bigint,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { group } from "./group";
import { user } from "./user";

export const user_group = pgTable(
  "user_group",
  {
    // References Supabase auth.users(id) — not this project's demo `user` table.
    // The FK constraint itself is added via a hand-written custom migration
    // (see drizzle/ migration adding user_group_user_id_fkey) rather than a
    // Drizzle-level relation, so drizzle-kit never tries to manage auth.users.
    user_id: uuid().notNull(),
    group_id: bigint({ mode: "number" }).notNull(),
    created_at: timestamp({
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.user_id, table.group_id] }),
    foreignKey({
      columns: [table.group_id],
      foreignColumns: [group.id],
      name: "user_group_group_id_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [user.id],
      name: "user_group_user_id_fkey",
    }).onDelete("restrict"),
    index("user_group_user_id_idx").on(table.user_id),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ],
);
