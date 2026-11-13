import { relations as defineRelations } from "drizzle-orm/relations";
import { todo } from "./todo";
import { relation } from "./relation-table";
import { todo_attachment } from "./todo-attachment";
import { group } from "./group";
import { userGroup } from "./user-group";
import { groupPermission } from "./group-permission";

export const todoRelations = defineRelations(todo, ({ one, many }) => ({
  relation: one(relation, {
    fields: [todo.user_id],
    references: [relation.id],
  }),
  todo_attachment: many(todo_attachment),
}));

export const relationRelations = defineRelations(relation, ({ many }) => ({
  todo: many(todo),
}));

export const todoAttachmentRelations = defineRelations(
  todo_attachment,
  ({ one }) => ({
    todo: one(todo, {
      fields: [todo_attachment.todo_id],
      references: [todo.id],
    }),
  }),
);

export const groupRelations = defineRelations(group, ({ many }) => ({
  userGroup: many(userGroup),
  groupPermission: many(groupPermission),
}));

// No relation object for the auth.users side of user_group — auth.users isn't
// part of this Drizzle schema (owned by Supabase).
export const userGroupRelations = defineRelations(userGroup, ({ one }) => ({
  group: one(group, {
    fields: [userGroup.groupId],
    references: [group.id],
  }),
}));

export const groupPermissionRelations = defineRelations(
  groupPermission,
  ({ one }) => ({
    group: one(group, {
      fields: [groupPermission.groupId],
      references: [group.id],
    }),
  }),
);
