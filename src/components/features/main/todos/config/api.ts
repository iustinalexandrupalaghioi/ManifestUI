"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { todos, relations } from "@/db/schema";
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
import type { Todo } from "@/app/types/main/Todo";
import { completeTodoSchema, todoSchema, type TodoFormValues } from "./schema";
import { todosDescriptor } from "./descriptor";

const PAGE_SIZE = 50;

const filterColumns: FilterColumnMap = {
  id: todos.id,
  title: todos.title,
  completed: todos.completed,
  created_at: todos.created_at,
  user_id: todos.user_id,
  notes: todos.notes,
  "relation.id": relations.id,
  "relation.username": relations.username,
  "relation.first_name": relations.first_name,
  "relation.last_name": relations.last_name,
  "relation.email": relations.email,
  "relation.gender": relations.gender,
};

const selection = {
  id: todos.id,
  title: todos.title,
  completed: todos.completed,
  created_at: todos.created_at,
  user_id: todos.user_id,
  notes: todos.notes,
  relation: {
    id: relations.id,
    username: relations.username,
    first_name: relations.first_name,
    last_name: relations.last_name,
    email: relations.email,
    gender: relations.gender,
    age: relations.age,
  },
};

const resourceAction = createResourceActions(todosDescriptor.id);

export const {
  fetchTodoList,
  fetchTodoDetail,
  addTodo,
  updateTodo,
  deleteTodos,
  completeTodos,
} = defineResourceActions("todos", {
  fetchTodoList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null) => {
    const where = buildWhereConditions(filters, filterColumns);
    const sortColumns = resolveSortColumns(sorting, filterColumns, {
      key: "id",
      column: todos.id,
    });
    const orderBy = buildOrderBy(sortColumns);
    const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));

    const [items, [{ count }]] = await Promise.all([
      db
        .select(selection)
        .from(todos)
        .innerJoin(relations, eq(todos.user_id, relations.id))
        .where(seekWhere)
        .orderBy(...orderBy)
        .limit(PAGE_SIZE),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(todos)
        .innerJoin(relations, eq(todos.user_id, relations.id))
        .where(where),
    ]);

    const nextCursor =
      items.length === PAGE_SIZE
        ? extractCursor(items[items.length - 1], sortColumns)
        : null;

      return { items: items as Todo[], total: count ?? 0, nextCursor };
    },
  ],

  fetchTodoDetail: [
    "read",
    async (id: number): Promise<Todo> => {
      const [row] = await db
        .select(selection)
        .from(todos)
        .leftJoin(relations, eq(todos.user_id, relations.id))
        .where(eq(todos.id, id))
        .limit(1);
      if (!row) throw new Error(`Todo ${id} not found`);
      return row as unknown as Todo;
    },
  ],

  addTodo: resourceAction.add(async (tx, data: TodoFormValues) => {
    const parsed = todoSchema.parse(data);
    const [result] = await tx
      .insert(todos)
      .values(parsed)
      .returning({ id: todos.id });
    return result.id;
  }),

  updateTodo: resourceAction.update(
    async (tx, id: number, data: TodoFormValues) => {
      const parsed = todoSchema.parse(data);
      await tx.update(todos).set(parsed).where(eq(todos.id, id));
    },
  ),

  deleteTodos: resourceAction.delete((tx, id: number) =>
    tx.delete(todos).where(eq(todos.id, id)),
  ),

  completeTodos: resourceAction.action("complete", (data: unknown) => {
    const parsed = completeTodoSchema.parse(data ?? {});
    return (tx, id: number) =>
      tx
        .update(todos)
        .set({
          completed: true,
          ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
        })
        .where(eq(todos.id, id));
  }),
});
