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
import { roles } from "./roles";
import { users } from "./users";

export const user_roles = pgTable(
  "user_roles",
  {
    // References Supabase auth.users(id) — not this project's demo `users` table.
    // The FK constraint itself is added via a hand-written custom migration
    // (see drizzle/ migration adding user_roles_user_id_fkey) rather than a
    // Drizzle-level relation, so drizzle-kit never tries to manage auth.users.
    user_id: uuid().notNull(),
    role_id: bigint({ mode: "number" }).notNull(),
    created_at: timestamp({
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.user_id, table.role_id] }),
    foreignKey({
      columns: [table.role_id],
      foreignColumns: [roles.id],
      name: "user_roles_role_id_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
      name: "user_roles_user_id_fkey",
    }).onDelete("restrict"),
    index("user_roles_user_id_idx").on(table.user_id),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ],
);
