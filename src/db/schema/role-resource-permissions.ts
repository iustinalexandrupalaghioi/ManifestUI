import {
  pgTable,
  foreignKey,
  pgPolicy,
  bigint,
  text,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { roles } from "./roles";

export const role_resource_permissions = pgTable(
  "role_resource_permissions",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "role_resource_permissions_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    role_id: bigint({ mode: "number" }).notNull(),
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
    unique("role_resource_permissions_role_id_resource_id_key").on(
      table.role_id,
      table.resource_id,
    ),
    foreignKey({
      columns: [table.role_id],
      foreignColumns: [roles.id],
      name: "role_resource_permissions_role_id_fkey",
    }).onDelete("restrict"),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ],
);
