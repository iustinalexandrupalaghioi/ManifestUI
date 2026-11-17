import type { ReactNode } from "react";
import type { z } from "zod";
import type { TranslatableText } from "@/framework/types/i18n-types";

/** A section's content schema: an object built from the field helpers (./fields.ts). */
export type SectionSchema = z.ZodObject<Record<string, z.ZodType>>;

type DeepPartial<T> = T extends readonly (infer I)[] ? DeepPartial<I>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

declare const DATA: unique symbol;
/** Type-only marker for the data a section's server loader provides; see `sectionData`. */
export interface SectionDataMarker<D> {
  readonly [DATA]?: D;
}

/**
 * Declares the type of the data a section needs besides its content (e.g.
 * records from the database). The loader itself is server-only, so it lives
 * apart from the section: see `defineSectionLoader` in "@/framework/site/server".
 */
export const sectionData = <D,>(): SectionDataMarker<D> => ({});

export interface SectionComponentProps<TContent, TData = undefined> {
  /** Stable section id; use it to build element ids (`${id}-title`). */
  id: string;
  content: TContent;
  /** From the section's server loader; undefined when it has none. */
  data: TData;
  /** True only in the CMS page editor. The primitives handle editing; use this for layout tweaks (e.g. open <details>). */
  edit: boolean;
}

export interface SectionDef<TType extends string = string, S extends SectionSchema = SectionSchema, TData = undefined> {
  /** Stored in `site_page.sections[].type`; unique across sections. */
  type: TType;
  label: TranslatableText;
  description?: TranslatableText;
  schema: S;
  /** Content of a newly added section, per locale ("en" is the fallback). */
  defaults?: Partial<Record<string, DeepPartial<z.output<S>>>>;
  /** `sectionData<T>()` when the section has a server loader. */
  data?: SectionDataMarker<TData>;
  /**
   * Renders the section. Runs on the server on the public site and in the
   * browser in the editor, so no client-only hooks (state, effects); texts,
   * lists and media use the primitives (<Text>, <List>, <RemoveItem>,
   * <AddItem>, <MediaEdit>).
   */
  component: (props: SectionComponentProps<z.output<S>, TData>) => ReactNode;
}

/** A section type for CMS-managed pages; register it in src/extensions/sections. */
export function defineSection<const TType extends string, S extends SectionSchema, TData = undefined>(
  def: SectionDef<TType, S, TData>,
): SectionDef<TType, S, TData> {
  return def;
}

/** Content for a newly added section of this type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function newSectionContent<S extends SectionSchema>(def: SectionDef<string, S, any>, locale = "en"): z.output<S> {
  return def.schema.parse(def.defaults?.[locale] ?? def.defaults?.en ?? {});
}
