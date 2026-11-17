import { z } from "zod";
import type { todo_attachment } from "@/db/schema";

export const attachmentSchema = z.object({
  todo_id: z.coerce.number().min(1, "Todo is required"),
  filename: z.string().min(1, "Filename is required"),
  path: z.string(),
}) satisfies z.ZodType<Omit<typeof todo_attachment.$inferInsert, "id" | "created_at">>;

export type AttachmentFormValues = z.infer<typeof attachmentSchema>;
