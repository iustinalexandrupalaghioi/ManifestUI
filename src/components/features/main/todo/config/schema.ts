import type { Todo } from "@/app/types/main/Todo";
import { z } from "zod";

export const todoSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  completed: z.boolean(),
  user_id: z.coerce.number().min(1, "User is required"),
  notes: z.string().trim().optional(),
}) satisfies z.ZodType<Pick<Todo, "title" | "completed" | "user_id">>;

export type TodoFormValues = z.infer<typeof todoSchema>;

export const completeWithNotesSchema = z.object({
  notes: z.string().trim().min(1, "Note is required"),
});

export type CompleteWithNoteValues = z.infer<typeof completeWithNotesSchema>;

export const completeTodoSchema = z.object({
  notes: z.string().trim().optional(),
});
