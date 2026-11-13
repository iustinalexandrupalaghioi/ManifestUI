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

export const groupPermission = pgTable(
  "group_permission",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "group_permission_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    groupId: bigint({ mode: "number" }).notNull(),
    // A code-level id, not a DB foreign key — either a resourceDescriptors
    // id (e.g. "todos", meaningful with can_read/add/update/delete) or a
    // grantableActions id (e.g. "todos:complete-with-note", meaningful with
    // `allowed`). See src/app/grantablePermissions.ts — the valid set lives
    // in code, not a database table, so there's nothing to foreign-key to.
    resourceId: text().notNull(),
    canRead: boolean().notNull().default(false),
    canAdd: boolean().notNull().default(false),
    canUpdate: boolean().notNull().default(false),
    canDelete: boolean().notNull().default(false),
    allowed: boolean().notNull().default(false),
  },
  (table) => [
    unique("group_permission_group_id_resource_id_key").on(
      table.groupId,
      table.resourceId,
    ),
    foreignKey({
      columns: [table.groupId],
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
