import {
  pgTable,
  foreignKey,
  pgPolicy,
  bigint,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { resources } from "./resources";

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
    resource_id: bigint({ mode: "number" }).notNull(),
    // Meaningful for resources.type = "resource" rows.
    can_read: boolean().notNull().default(false),
    can_add: boolean().notNull().default(false),
    can_update: boolean().notNull().default(false),
    can_delete: boolean().notNull().default(false),
    // Meaningful for resources.type = "action" rows.
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
    foreignKey({
      columns: [table.resource_id],
      foreignColumns: [resources.id],
      name: "role_resource_permissions_resource_id_fkey",
    }).onDelete("restrict"),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ],
);
