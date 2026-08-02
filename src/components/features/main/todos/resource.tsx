"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { Todo } from "@/app/types/main/Todo";

import { useTodoBulkActions } from "./config/actions/complete";
import { completeWithNotes } from "./config/actions/complete-with-notes";
import {
  fetchTodoDetail,
  fetchTodoList,
  addTodo,
  updateTodo,
  deleteTodos,
} from "./config/api";
import { todosForm } from "./config/form";
import { todoSchema, type TodoFormValues } from "./config/schema";
import { todosTabs } from "./config/tabs";
import { todosRelations } from "./config/relations";
import { todoColumns, todoPickupColumns } from "./config/columns";
import { todosDetailSlots } from "./config/detailSlots";

// ─────────────────────────────────────────────
// Resource
// ─────────────────────────────────────────────

export const todosResource = defineResource<Todo, TodoFormValues>({
  id: "todos",
  noun: "todo",
  queryKey: ["todos"],
  schema: todoSchema,

  routes: {
    list: "/todos",
    add: "/todos/add",
    detail: (id: string) => `/todos/${id}`,
  },

  labels: {
    singular: "To do",
    plural: "To dos",
    new: "To do",
  },

  openMode: "page",
  addMode: "page",

  emptyValues: {
    title: "",
    completed: false,
    user_id: 0,
  },

  fetchList: fetchTodoList,
  fetchDetail: fetchTodoDetail,
  mutationFns: { add: addTodo, update: updateTodo, delete: deleteTodos },

  isDeleteEligible: (todo) => !!todo.completed,
  getRowUrl: (todo) => `${process.env.NEXT_PUBLIC_BASE_URL}/todos/${todo.id}`,
  bulkActions: useTodoBulkActions,

  columns: todoColumns,
  pickupColumns: todoPickupColumns,

  form: todosForm,

  // tabs: todosTabs,
  relations: todosRelations,
  detailSlots: todosDetailSlots,
  actionForms: [completeWithNotes],

  defaultTab: "attachments",
  defaultFormOpen: true,

  overviewKey: "todos-overview",
  defaultViewName: "To do's",
});

export const { hooks: todoHooks, components: todoComponents } = todosResource;

export const todoKeys = todoHooks.keys;
export const OVERVIEW_KEY = "todos-overview";
export const useTodosInfinite = todoHooks.useList;
export const useTodo = todoHooks.useDetail;

export const {
  Overview: TodoOverview,
  AddDialog: TodoAddDialog,
  DetailDialog: TodoDetailDialog,
  AddPage: TodoAddPage,
  DetailPage: TodoDetailPage,
  LookupDialog: TodoLookupDialog,
} = todoComponents;
