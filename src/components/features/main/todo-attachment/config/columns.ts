import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig"
import { BUCKET } from "./constants"

export const attachmentColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", size: 70 },
  { field: "filename", label: { en: "File name", ro: "Nume fișier" }, type: "text", size: 350 },
  {
    field: "path",
    label: { en: "File", ro: "Fișier" },
    type: "file",
    size: 120,
    bucket: BUCKET,
    sortable: false,
    filterable: false,
  },
  {
    field: "todo_title",
    label: { en: "Title", ro: "Titlu" },
    type: "text",
    size: 500,
    columnName: "title",
    origin: "todos",
    accessorFn: (row) => row.todos?.title,
    navigationHidden: true,
  },
  {
    field: "todo_completed",
    label: { en: "Completed", ro: "Finalizat" },
    type: "boolean",
    size: 120,
    columnName: "completed",
    origin: "todos",
    accessorFn: (row) => row.todos?.completed,
    navigationHidden: true,
  },
  {
    field: "todo_id",
    label: { en: "To do", ro: "Sarcină" },
    type: "number",
    size: 120,
    columnName: "id",
    origin: "todos",
    accessorFn: (row) => row.todos?.id,
    navigationHidden: true,
  },
  {
    field: "created_at",
    label: { en: "Created at", ro: "Data creării" },
    type: "datetime",
    size: 140,
    hidden: true,
  },
]

// List/card presentation. `todo_id` (the raw related-todo id) is left out
// here — `todo_title` already represents that relation and is what's worth
// showing on a card.
export const attachmentListColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", hidden: true },
  { field: "filename", label: { en: "File name", ro: "Nume fișier" }, type: "text" },
  {
    field: "path",
    label: { en: "File", ro: "Fișier" },
    type: "file",
    bucket: BUCKET,
    sortable: false,
    filterable: false,
  },
  {
    field: "todo_title",
    label: { en: "Title", ro: "Titlu" },
    type: "text",
    columnName: "title",
    origin: "todos",
    accessorFn: (row) => row.todos?.title,
    navigationHidden: true,
    group: "todo",
    groupLabel: { en: "Task", ro: "Sarcină" },
  },
  {
    field: "todo_completed",
    label: { en: "Completed", ro: "Finalizat" },
    type: "boolean",
    columnName: "completed",
    origin: "todos",
    accessorFn: (row) => row.todos?.completed,
    navigationHidden: true,
    group: "todo",
  },
  {
    field: "created_at",
    label: { en: "Created at", ro: "Data creării" },
    type: "datetime",
    hidden: true,
  },
]
