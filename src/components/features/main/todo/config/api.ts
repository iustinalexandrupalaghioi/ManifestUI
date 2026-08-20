"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { todo, relation } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { createResourceActions } from "@/app/[locale]/cms/createResourceActions";
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "@/framework/components/data-view/features/filtering/filters";
import {
  buildAggregateSelection,
  buildKeysetWhere,
  buildOrderBy,
  buildWhereConditions,
  extractCursor,
  resolveSortColumns,
  type FilterColumnMap,
} from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { AggregateRule } from "@/framework/components/data-view/features/aggregates/aggregates";
import type { Cursor } from "@/framework/types/pagination";
import type { Todo } from "@/app/types/main/Todo";
import { completeTodoSchema, todoSchema, type TodoFormValues } from "./schema";
import { todosDescriptor } from "./descriptor";

const PAGE_SIZE = 50;

const filterColumns: FilterColumnMap = {
  id: todo.id,
  title: todo.title,
  completed: todo.completed,
  created_at: todo.created_at,
  user_id: todo.user_id,
  notes: todo.notes,
  "relation.id": relation.id,
  "relation.username": relation.username,
  "relation.first_name": relation.first_name,
  "relation.last_name": relation.last_name,
  "relation.email": relation.email,
  "relation.gender": relation.gender,
};

const selection = {
  id: todo.id,
  title: todo.title,
  completed: todo.completed,
  created_at: todo.created_at,
  user_id: todo.user_id,
  notes: todo.notes,
  relation: {
    id: relation.id,
    username: relation.username,
    first_name: relation.first_name,
    last_name: relation.last_name,
    email: relation.email,
    gender: relation.gender,
    age: relation.age,
  },
};

const resourceAction = createResourceActions(todosDescriptor.id);

export const {
  fetchTodoList,
  fetchTodoAggregates,
  fetchTodoDetail,
  addTodo,
  updateTodo,
  deleteTodos,
  completeTodos,
} = defineResourceActions("todos", {
  fetchTodoList: [
    "read",
    async (
      sorting: SortRule[],
      filters: FilterRule[],
      cursor: Cursor | null,
    ) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: todo.id,
      });
      const orderBy = buildOrderBy(sortColumns);
      const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));

      const [items, [{ count }]] = await Promise.all([
        db
          .select(selection)
          .from(todo)
          .innerJoin(relation, eq(todo.user_id, relation.id))
          .where(seekWhere)
          .orderBy(...orderBy)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(todo)
          .innerJoin(relation, eq(todo.user_id, relation.id))
          .where(where),
      ]);

      const nextCursor =
        items.length === PAGE_SIZE
          ? extractCursor(items[items.length - 1], sortColumns)
          : null;

      return { items: items as Todo[], total: count ?? 0, nextCursor };
    },
  ],

  fetchTodoAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const selection = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(selection).length === 0) return {};

      const [row] = await db
        .select(selection)
        .from(todo)
        .innerJoin(relation, eq(todo.user_id, relation.id))
        .where(where);
      return row;
    },
  ],

  fetchTodoDetail: [
    "read",
    async (id: number): Promise<Todo> => {
      const [row] = await db
        .select(selection)
        .from(todo)
        .leftJoin(relation, eq(todo.user_id, relation.id))
        .where(eq(todo.id, id))
        .limit(1);
      if (!row) throw new Error(`Todo ${id} not found`);
      return row as Todo;
    },
  ],

  addTodo: resourceAction.add(async (tx, data: TodoFormValues) => {
    const parsed = todoSchema.parse(data);
    const [result] = await tx
      .insert(todo)
      .values(parsed)
      .returning({ id: todo.id });
    return result.id;
  }),

  updateTodo: resourceAction.update(
    async (tx, id: number, data: TodoFormValues) => {
      const parsed = todoSchema.parse(data);
      await tx.update(todo).set(parsed).where(eq(todo.id, id));
    },
  ),

  deleteTodos: resourceAction.delete((tx, id: number) =>
    tx.delete(todo).where(eq(todo.id, id)),
  ),

  completeTodos: resourceAction.action("complete", (data: unknown) => {
    const parsed = completeTodoSchema.parse(data ?? {});
    return (tx, id: number) =>
      tx
        .update(todo)
        .set({
          completed: true,
          ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
        })
        .where(eq(todo.id, id));
  }),
});
