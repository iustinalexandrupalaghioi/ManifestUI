import { z } from "zod";
import type { TodoAttachment } from "@/app/types/main/Attachment";

export const attachmentSchema = z.object({
  todo_id: z.coerce.number().min(1, "Todo is required"),
  filename: z.string().min(1, "Filename is required"),
  path: z.string(),
}) satisfies z.ZodType<Omit<TodoAttachment, "id" | "created_at">>;

export type AttachmentFormValues = z.infer<typeof attachmentSchema>;
