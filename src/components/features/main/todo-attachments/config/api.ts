"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { todo_attachments, todos } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { createResourceActions } from "@/app/createResourceActions";
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
  id: todo_attachments.id,
  filename: todo_attachments.filename,
  path: todo_attachments.path,
  created_at: todo_attachments.created_at,
  "todos.id": todos.id,
  "todos.title": todos.title,
  "todos.completed": todos.completed,
};

const selection = {
  id: todo_attachments.id,
  created_at: todo_attachments.created_at,
  path: todo_attachments.path,
  todo_id: todo_attachments.todo_id,
  filename: todo_attachments.filename,
  todos: { id: todos.id, title: todos.title, completed: todos.completed },
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
      column: todo_attachments.id,
    });
    const orderBy = buildOrderBy(sortColumns);
    const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));

    const [items, [{ count }]] = await Promise.all([
      db
        .select(selection)
        .from(todo_attachments)
        .innerJoin(todos, eq(todos.id, todo_attachments.todo_id))
        .where(seekWhere)
        .orderBy(...orderBy)
        .limit(PAGE_SIZE),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(todo_attachments)
        .innerJoin(todos, eq(todos.id, todo_attachments.todo_id))
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
        .from(todo_attachments)
        .leftJoin(todos, eq(todos.id, todo_attachments.todo_id))
        .where(eq(todo_attachments.id, id))
        .limit(1);
      if (!row) throw new Error(`Attachment ${id} not found`);
      return row as unknown as TodoAttachment;
    },
  ],

  addAttachment: resourceAction.add(async (tx, data: AttachmentFormValues) => {
    const parsed = attachmentSchema.parse(data);
    const [result] = await tx
      .insert(todo_attachments)
      .values({ ...parsed, path: parsed.path ?? "" })
      .returning({ id: todo_attachments.id });
    return result.id;
  }),

  // `alsoAllow: ["add"]` — attaching an uploaded file's path runs through
  // this same update after the add screen's background upload finishes, so
  // a role with only "add" (no "update") still needs to complete it.
  updateAttachment: resourceAction.update(
    async (tx, id: number, data: AttachmentFormValues) => {
      const parsed = attachmentSchema.parse(data);
      await tx
        .update(todo_attachments)
        .set(parsed)
        .where(eq(todo_attachments.id, id));
    },
    { alsoAllow: ["add"] },
  ),

  deleteAttachments: resourceAction.delete((tx, id: number) =>
    tx.delete(todo_attachments).where(eq(todo_attachments.id, id)),
  ),
});
