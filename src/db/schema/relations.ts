import { relations as defineRelations } from "drizzle-orm/relations";
import { todos } from "./todos";
import { relations } from "./relations-table";
import { todo_attachments } from "./todo-attachments";
import { roles } from "./roles";
import { resources } from "./resources";
import { user_roles } from "./user-roles";
import { role_resource_permissions } from "./role-resource-permissions";

export const todosRelations = defineRelations(todos, ({ one, many }) => ({
  relation: one(relations, {
    fields: [todos.user_id],
    references: [relations.id],
  }),
  todo_attachments: many(todo_attachments),
}));

export const relationsTableRelations = defineRelations(relations, ({ many }) => ({
  todos: many(todos),
}));

export const todo_attachmentsRelations = defineRelations(
  todo_attachments,
  ({ one }) => ({
    todo: one(todos, {
      fields: [todo_attachments.todo_id],
      references: [todos.id],
    }),
  }),
);

export const rolesRelations = defineRelations(roles, ({ many }) => ({
  user_roles: many(user_roles),
  role_resource_permissions: many(role_resource_permissions),
}));

export const resourcesRelations = defineRelations(resources, ({ many }) => ({
  role_resource_permissions: many(role_resource_permissions),
}));

// No relation object for the auth.users side of user_roles — auth.users isn't
// part of this Drizzle schema (owned by Supabase).
export const userRolesRelations = defineRelations(user_roles, ({ one }) => ({
  role: one(roles, {
    fields: [user_roles.role_id],
    references: [roles.id],
  }),
}));

export const roleResourcePermissionsRelations = defineRelations(
  role_resource_permissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [role_resource_permissions.role_id],
      references: [roles.id],
    }),
    resource: one(resources, {
      fields: [role_resource_permissions.resource_id],
      references: [resources.id],
    }),
  }),
);
