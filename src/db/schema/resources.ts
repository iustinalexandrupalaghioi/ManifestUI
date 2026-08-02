import {
  pgTable,
  pgPolicy,
  text,
  bigint,
  timestamp,
  check,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Grantable units for role_resource_permissions. Two shapes, told apart by
// `type`:
//   "resource" — name is a defineResource() id (e.g. "users"), parent_resource_id
//                 is null; gets the 4 CRUD switches (can_read/add/update/delete).
//   "action"   — name is a short action key (e.g. "complete-with-note"),
//                 parent_resource_id points at the owning "resource" row (e.g.
//                 "todos"); gets a single "allowed" switch. hasPermission is
//                 checked against "<parent.name>:<name>".
export const resources = pgTable(
  "resources",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "resources_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    name: text().notNull(),
    parent_resource_id: bigint({ mode: "number" }),
    type: text().notNull().default("resource"),
    label: text().notNull(),
    // Singular caption ("To do") vs. `label`'s plural ("Todos"); only set
    // for type="resource" rows.
    singular_label: text(),
    // Backing Postgres table (e.g. "todo_attachments"); only set for
    // type="resource" rows.
    table_name: text(),
    description: text().default(""),
    created_at: timestamp({
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("resources_name_parent_resource_id_key").on(
      table.name,
      table.parent_resource_id,
    ),
    foreignKey({
      columns: [table.parent_resource_id],
      foreignColumns: [table.id],
      name: "resources_parent_resource_id_fkey",
    }).onDelete("cascade"),
    check("resources_type_check", sql`${table.type} in ('resource', 'action')`),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ],
);
