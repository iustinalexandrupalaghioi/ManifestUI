"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { Todo } from "@/app/types/main/Todo";

import { useTodoBulkActions } from "./config/actions/complete";
import { completeWithNotes } from "./config/actions/complete-with-notes";
import {
  fetchTodoDetail,
  fetchTodoList,
  fetchTodoAggregates,
  fetchTodoGroupAggregates,
  addTodo,
  updateTodo,
  deleteTodos,
} from "./config/api";
import { todosForm } from "./config/form";
import { todoSchema, type TodoFormValues } from "./config/schema";
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
  descriptor: todosDescriptor,

  presentation: {
    open: "page",
    add: "page",
    split: { onOpen: "open-first" },
  },

  data: {
    fetchList: fetchTodoList,
    fetchAggregates: fetchTodoAggregates,
    fetchGroupAggregates: fetchTodoGroupAggregates,
    fetchDetail: fetchTodoDetail,
    mutations: { add: addTodo, update: updateTodo, delete: deleteTodos },
  },

  form: {
    schema: todoSchema,
    emptyValues: {
      title: "",
      completed: false,
      user_id: 0,
    },
    layout: todosForm,
  },

  detail: {
    // tabs: todosTabs,
    relations: todosRelations,
    slots: todosDetailSlots,
    defaultTab: "attachments",
    defaultFormOpen: true,
  },

  actions: {
    forms: [completeWithNotes],
    bulk: useTodoBulkActions,
    isDeleteEligible: (todo) => !!todo.completed,
  },

  dataView: {
    overview: {
      dataTableColumns: todoColumns,
      dataListColumns: todoListColumns,
    },
    pickup: { dataTableColumns: todoPickupColumns },
  },
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
  PickupDialog: TodoPickupDialog,
} = todoComponents;
