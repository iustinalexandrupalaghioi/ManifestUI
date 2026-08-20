"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { Todo } from "@/app/types/main/Todo";

import { useTodoBulkActions } from "./config/actions/complete";
import { completeWithNotes } from "./config/actions/complete-with-notes";
import {
  fetchTodoDetail,
  fetchTodoList,
  fetchTodoAggregates,
  addTodo,
  updateTodo,
  deleteTodos,
} from "./config/api";
import { todosForm } from "./config/form";
import { todoSchema, type TodoFormValues } from "./config/schema";
import { todosTabs } from "./config/tabs";
import { todosRelations } from "./config/relations";
import {
  todoColumns,
  todoListColumns,
  todoPickupColumns,
} from "./config/columns";
import { todosDetailSlots } from "./config/detailSlots";
import { todosDescriptor } from "./config/descriptor";

// ─────────────────────────────────────────────
// Resource
// ─────────────────────────────────────────────

export const todosResource = defineResource<Todo, TodoFormValues>({
  id: todosDescriptor.id,
  noun: todosDescriptor.noun,
  queryKey: todosDescriptor.queryKey,
  schema: todoSchema,

  routes: todosDescriptor.routes,

  labels: todosDescriptor,

  openMode: "page",
  addMode: "page",
  splitConfig: {
    onOpen: "selectFirst",
  },
  editable: true,
  emptyValues: {
    title: "",
    completed: false,
    user_id: 0,
  },

  fetchList: fetchTodoList,
  fetchAggregates: fetchTodoAggregates,
  fetchDetail: fetchTodoDetail,
  mutationFns: { add: addTodo, update: updateTodo, delete: deleteTodos },

  isDeleteEligible: (todo) => !!todo.completed,
  bulkActions: useTodoBulkActions,

  columns: todoColumns,
  listColumns: todoListColumns,
  pickupColumns: todoPickupColumns,

  form: todosForm,

  // tabs: todosTabs,
  relations: todosRelations,
  detailSlots: todosDetailSlots,
  actionForms: [completeWithNotes],

  defaultTab: "attachments",
  defaultFormOpen: true,

  overviewKey: todosDescriptor.overviewKey,
  defaultViewName: todosDescriptor.defaultViewName,
});

export const { hooks: todoHooks, components: todoComponents } = todosResource;

export const todoKeys = todoHooks.keys;
export const OVERVIEW_KEY = todosDescriptor.overviewKey;
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
