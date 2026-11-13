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

export const userGroup = pgTable(
  "user_group",
  {
    // References Supabase auth.users(id) — not this project's demo `user` table.
    // The FK constraint itself is added via a hand-written custom migration
    // (see drizzle/ migration adding user_group_user_id_fkey) rather than a
    // Drizzle-level relation, so drizzle-kit never tries to manage auth.users.
    userId: uuid().notNull(),
    groupId: bigint({ mode: "number" }).notNull(),
    createdAt: timestamp({
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.groupId] }),
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [group.id],
      name: "user_group_group_id_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_group_user_id_fkey",
    }).onDelete("restrict"),
    index("user_group_user_id_idx").on(table.userId),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ],
);
