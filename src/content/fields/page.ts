import { z } from "zod";
import { blocks, choice, L, richText, text } from "@/framework/content";
import { allBlocks } from "../blocks";

/** A page's editable fields (the CMS form and the content layer use the same schema). */
export const pageFields = z.object({
  slug: text({ label: L("Page address", "Adresa paginii"), required: true }),
  title: text({ label: L("Title", "Titlu"), required: true }),
  description: text({ label: L("Search engine description", "Descriere pentru motoarele de căutare"), multiline: true }),
  kind: choice(
    [
      { value: "sections", label: L("Blocks page", "Pagină din blocuri") },
      { value: "text", label: L("Text page", "Pagină de text") },
    ],
    { label: L("Page type", "Tipul paginii"), default: "text" },
  ),
  /** Markdown, for text pages (the legal pages). */
  body: richText({ label: L("Content", "Conținut") }),
  /**
   * The blocks of a blocks page. Stored in the `sections` column (the shape
   * the website builder used), so existing pages need no rewrite.
   */
  sections: blocks(allBlocks, { label: L("Blocks", "Blocuri"), max: 50 }),
});
