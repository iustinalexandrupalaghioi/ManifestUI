import { registerExtensions } from "@/framework/extensions";
import { todoAttachmentsPanel } from "@/components/features/main/todo/config/attachmentsPanel";
import { ratingField } from "./RatingField";
import { recordInfoBlock } from "./RecordInfoBlock";

/** App components that extend the framework; import once on the client (CMS + dev providers). */
export const extensions = registerExtensions([ratingField, recordInfoBlock, todoAttachmentsPanel]);

declare module "@/framework/extensions/registry" {
  interface Register {
    extensions: typeof extensions;
  }
}
