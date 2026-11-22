"use client";

import { FileStackIcon } from "lucide-react";
import { z } from "zod";
import { defineBlockComponent } from "@/framework/extensions";
import { getContentType } from "../define";
import { schemaAt } from "../fields";
import { ContentFieldEditor } from "./fieldEditors";

/**
 * A form section that edits one content field from its content type's schema: blocks,
 * groups, lists, references, links… In a resource form:
 *
 *   { type: "contentField", props: { name: "sections", type: "page" } }
 *   { type: "contentField", props: { name: "content.header", type: "navigation", field: "header" } }
 *
 * `name` is the form path; `type` the content type (registered with registerContentTypes);
 * `field` the path inside its fields (the last part of `name` when left out). Plain values, so
 * the Form Designer can place it, and the editor matches what reads and saves check.
 */
export const contentFieldBlock = defineBlockComponent({
  type: "contentField",
  label: { en: "Content field", ro: "Câmp de conținut" },
  description: { en: "Edits a content field from its content type", ro: "Editează un câmp de conținut după tipul lui de conținut" },
  icon: FileStackIcon,
  props: z.object({
    name: z.string().describe("The form path, e.g. sections or content.header"),
    type: z.string().describe("The content type, e.g. page or navigation"),
    field: z.string().default("").describe("The field inside the content type (default: the last part of the path)"),
  }),
  component: function ContentFieldSection({ props, disabled, readOnly }) {
    const def = getContentType(props.type);
    const field = props.field || (props.name.split(".").pop() ?? props.name);
    const schema = def ? schemaAt(def.fields, field.split(".")) : undefined;
    if (!schema) {
      if (process.env.NODE_ENV !== "production") console.warn(`[contentField] no field "${field}" in content type "${props.type}"`);
      return null;
    }
    return <ContentFieldEditor name={props.name} schema={schema} fieldKey={field.split(".").pop() ?? field} disabled={disabled || readOnly} />;
  },
});
