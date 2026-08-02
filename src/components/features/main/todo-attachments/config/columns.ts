import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig"
import { BUCKET } from "./constants"

export const attachmentColumns: ColumnConfig[] = [
  { field: "id", label: "Id", type: "number", size: 70, cardHidden: true },
  { field: "filename", label: "File name", type: "text", size: 350 },
  {
    field: "path",
    label: "File",
    type: "file",
    size: 120,
    bucket: BUCKET,
    sortable: false,
    filterable: false,
  },
  {
    field: "todo_title",
    label: "Title",
    type: "text",
    size: 500,
    columnName: "title",
    origin: "todos",
    accessorFn: (row) => row.todos?.title,
    navigationHidden: true,
  },
  {
    field: "todo_completed",
    label: "Completed",
    type: "boolean",
    size: 120,
    columnName: "completed",
    origin: "todos",
    accessorFn: (row) => row.todos?.completed,
    navigationHidden: true,
  },
  {
    field: "todo_id",
    label: "To do",
    type: "number",
    size: 120,
    columnName: "id",
    origin: "todos",
    accessorFn: (row) => row.todos?.id,
    navigationHidden: true,
  },
  {
    field: "created_at",
    label: "Created at",
    type: "datetime",
    size: 140,
    hidden: true,
  },
]
