import { Todo } from "./Todo";

export type TodoAttachment = {
  id: number;
  todo_id: number;
  created_at: string;
  filename: string;
  path: string;
  todos?: Pick<Todo, "id" | "title" | "completed"> | null;
};
