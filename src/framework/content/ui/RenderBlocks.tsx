/**
 * Rendering blocks with plain React components: each block type maps to a
 * component that receives its content as props. No context, no editing
 * layer; works on the server and in the browser.
 *
 *   const blockComponents = { hero: Hero, faq: Faq } satisfies BlockComponents;
 *   <RenderBlocks blocks={page.sections} components={blockComponents} data={data} />
 *
 * In the CMS live preview (`preview`), `field(...path)` marks an element with
 * its field path (`data-cms-field="sections[b_x7k2].items.0.q"`), so clicking it
 * opens that field; on the public site it returns nothing.
 */
import type { ComponentType } from "react";
import type { z } from "zod";
import type { AnyBlockDef } from "../blocks";
import type { Resolved } from "../resolve";

/** Marks an element as showing a field: `{...field("items", 0, "quote")}`. Empty outside the preview. */
export type FieldMarker = (...path: (string | number)[]) => { "data-cms-field"?: string };

export interface BlockProps<B extends AnyBlockDef, TData = undefined> {
  /** The block's stable id (use it to build element ids). */
  id: string;
  /** The block's fields as readers get them (references resolved, links with their address). */
  content: Resolved<z.output<B["fields"]>>;
  /** From the block type's server loader (see defineBlockLoader); undefined without one. */
  data: TData;
  field: FieldMarker;
}

export type BlockComponent<B extends AnyBlockDef, TData = undefined> = ComponentType<BlockProps<B, TData>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockComponents = Record<string, ComponentType<BlockProps<any, any>>>;

const noMarker: FieldMarker = () => ({});

/** A field marker for the block `id` of the blocks field `fieldName`, or none outside the preview. */
export function fieldMarker(fieldName: string | undefined, id: string): FieldMarker {
  if (!fieldName) return noMarker;
  return (...path) => ({ "data-cms-field": `${fieldName}[${id}]${path.length ? `.${path.join(".")}` : ""}` });
}

/**
 * The visible blocks, in order, each through its type's component (blocks of
 * an unknown type are skipped). `data` holds each type's loader result;
 * `preview` names the blocks field when rendering in the CMS preview.
 */
export function RenderBlocks({
  blocks,
  components,
  data = {},
  preview,
}: {
  blocks: readonly { id: string; type: string; hidden?: boolean; content: unknown }[];
  components: BlockComponents;
  data?: Record<string, unknown>;
  preview?: { field: string };
}) {
  return (
    <>
      {blocks
        .filter((block) => !block.hidden)
        .map((block) => {
          const Component = components[block.type];
          return Component ? (
            <Component key={block.id} id={block.id} content={block.content} data={data[block.type]} field={fieldMarker(preview?.field, block.id)} />
          ) : null;
        })}
    </>
  );
}
