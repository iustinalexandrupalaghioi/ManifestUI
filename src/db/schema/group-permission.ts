import {
  pgTable,
  foreignKey,
  pgPolicy,
  bigint,
  text,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { group } from "./group";

export const group_permission = pgTable(
  "group_permission",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "group_permission_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    group_id: bigint({ mode: "number" }).notNull(),
    // A code-level id, not a DB foreign key — either a resourceDescriptors
    // id (e.g. "todos", meaningful with can_read/add/update/delete) or a
    // grantableActions id (e.g. "todos:complete-with-note", meaningful with
    // `allowed`). See src/app/grantablePermissions.ts — the valid set lives
    // in code, not a database table, so there's nothing to foreign-key to.
    resource_id: text().notNull(),
    can_read: boolean().notNull().default(false),
    can_add: boolean().notNull().default(false),
    can_update: boolean().notNull().default(false),
    can_delete: boolean().notNull().default(false),
    allowed: boolean().notNull().default(false),
  },
  (table) => [
    unique("group_permission_group_id_resource_id_key").on(
      table.group_id,
      table.resource_id,
    ),
    foreignKey({
      columns: [table.group_id],
      foreignColumns: [group.id],
      name: "group_permission_group_id_fkey",
    }).onDelete("restrict"),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ],
);
