"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { todo_attachment, todo } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { createResourceActions } from "@/app/[locale]/cms/createResourceActions";
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "@/framework/components/data-view/features/filtering/filters";
import {
  buildKeysetWhere,
  buildOrderBy,
  buildWhereConditions,
  extractCursor,
  resolveSortColumns,
  type FilterColumnMap,
} from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { Cursor } from "@/framework/types/pagination";
import type { TodoAttachment } from "@/app/types/main/Attachment";
import { attachmentSchema, type AttachmentFormValues } from "./schema";
import { attachmentsDescriptor } from "./descriptor";

const PAGE_SIZE = 50;

const filterColumns: FilterColumnMap = {
  id: todo_attachment.id,
  filename: todo_attachment.filename,
  path: todo_attachment.path,
  created_at: todo_attachment.created_at,
  "todos.id": todo.id,
  "todos.title": todo.title,
  "todos.completed": todo.completed,
};

const selection = {
  id: todo_attachment.id,
  created_at: todo_attachment.created_at,
  path: todo_attachment.path,
  todo_id: todo_attachment.todo_id,
  filename: todo_attachment.filename,
  todos: { id: todo.id, title: todo.title, completed: todo.completed },
};

const resourceAction = createResourceActions(attachmentsDescriptor.id);

export const {
  fetchAttachmentList,
  fetchAttachmentDetail,
  addAttachment,
  updateAttachment,
  deleteAttachments,
} = defineResourceActions("attachments", {
  fetchAttachmentList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null) => {
    const where = buildWhereConditions(filters, filterColumns);
    const sortColumns = resolveSortColumns(sorting, filterColumns, {
      key: "id",
      column: todo_attachment.id,
    });
    const orderBy = buildOrderBy(sortColumns);
    const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));

    const [items, [{ count }]] = await Promise.all([
      db
        .select(selection)
        .from(todo_attachment)
        .innerJoin(todo, eq(todo.id, todo_attachment.todo_id))
        .where(seekWhere)
        .orderBy(...orderBy)
        .limit(PAGE_SIZE),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(todo_attachment)
        .innerJoin(todo, eq(todo.id, todo_attachment.todo_id))
        .where(where),
    ]);

    const nextCursor =
      items.length === PAGE_SIZE
        ? extractCursor(items[items.length - 1], sortColumns)
        : null;

      return { items: items as TodoAttachment[], total: count ?? 0, nextCursor };
    },
  ],

  fetchAttachmentDetail: [
    "read",
    async (id: number): Promise<TodoAttachment> => {
      const [row] = await db
        .select(selection)
        .from(todo_attachment)
        .leftJoin(todo, eq(todo.id, todo_attachment.todo_id))
        .where(eq(todo_attachment.id, id))
        .limit(1);
      if (!row) throw new Error(`Attachment ${id} not found`);
      return row as unknown as TodoAttachment;
    },
  ],

  addAttachment: resourceAction.add(async (tx, data: AttachmentFormValues) => {
    const parsed = attachmentSchema.parse(data);
    const [result] = await tx
      .insert(todo_attachment)
      .values({ ...parsed, path: parsed.path ?? "" })
      .returning({ id: todo_attachment.id });
    return result.id;
  }),

  // `alsoAllow: ["add"]` — attaching an uploaded file's path runs through
  // this same update after the add screen's background upload finishes, so
  // a group with only "add" (no "update") still needs to complete it.
  updateAttachment: resourceAction.update(
    async (tx, id: number, data: AttachmentFormValues) => {
      const parsed = attachmentSchema.parse(data);
      await tx
        .update(todo_attachment)
        .set(parsed)
        .where(eq(todo_attachment.id, id));
    },
    { alsoAllow: ["add"] },
  ),

  deleteAttachments: resourceAction.delete((tx, id: number) =>
    tx.delete(todo_attachment).where(eq(todo_attachment.id, id)),
  ),
});
