import { z } from "zod";

export const contentDraftSchema = z.object({
  type: z.string(),
  rowId: z.string(),
  data: z.unknown(),
});

export type ContentDraftFormValues = z.infer<typeof contentDraftSchema>;
