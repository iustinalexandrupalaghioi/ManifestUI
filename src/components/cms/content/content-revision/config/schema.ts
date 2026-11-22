import { z } from "zod";

export const contentRevisionSchema = z.object({
  type: z.string(),
  rowId: z.string(),
  data: z.unknown(),
});

export type ContentRevisionFormValues = z.infer<typeof contentRevisionSchema>;
