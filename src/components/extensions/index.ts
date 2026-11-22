import { registerExtensions } from "@/framework/extensions";
import { frameworkExtensions, grantExtensions, setMarkdownRenderer } from "@/framework/extensions/builtin";
import { Markdown } from "@/components/site/learn/Markdown";
import { resourceDescriptors } from "@/app/[locale]/cms/resourceDescriptors";
import { todoAttachmentsPanel } from "@/components/cms/main/todo/config/attachmentsPanel";

// The Markdown editor previews with the website's renderer, so it matches the published page.
setMarkdownRenderer(Markdown);

/**
 * The framework's components plus this project's own; import once on the client (CMS + dev providers).
 */
export const extensions = registerExtensions([
  ...frameworkExtensions,
  ...grantExtensions({ resources: resourceDescriptors }),
  todoAttachmentsPanel,
]);

declare module "@/framework/extensions/registry" {
  interface Register {
    extensions: typeof extensions;
  }
}
