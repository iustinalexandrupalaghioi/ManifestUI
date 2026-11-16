import { registerExtensions } from "@/framework/extensions";
import { todoAttachmentsPanel } from "@/components/features/main/todo/config/attachmentsPanel";
import { ratingField } from "./RatingField";
import { recordInfoBlock } from "./RecordInfoBlock";
import { markdownField } from "./MarkdownField";
import { pageAddressField } from "./PageAddressField";
import { sectionsEditor } from "./SectionsEditor";
import { siteImageField } from "./SiteImageField";

/** App components that extend the framework; import once on the client (CMS + dev providers). */
export const extensions = registerExtensions([ratingField, recordInfoBlock, todoAttachmentsPanel, markdownField, pageAddressField, siteImageField, sectionsEditor]);

declare module "@/framework/extensions/registry" {
  interface Register {
    extensions: typeof extensions;
  }
}
