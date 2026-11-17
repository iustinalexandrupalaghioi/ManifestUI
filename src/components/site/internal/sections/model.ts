/**
 * Site sections: the content behind CMS-managed pages built from sections
 * (stored in `site_page.sections`). Each section type is defined once with
 * `defineSection` in src/extensions/sections; this file types the generic
 * helpers of the site module with the registered types.
 *
 * Client-safe: imported by the site, the preview frame and the CMS editor.
 */
import type { z } from "zod";
import { type AnySectionDef, blankListItem as blankItem, getSection, labelPath, newSection, parseSections as parse, validateSections as validate } from "@/modules/site";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { TranslatableText } from "@/framework/types/i18n-types";
import { sections } from "@/extensions/sections";
// The header and footer (Site settings) render and edit like sections too.
import "@/extensions/site";

// Until a section is registered, any section type (so an empty registry still typechecks).
type RegisteredDef = [(typeof sections)[number]] extends [never] ? AnySectionDef : (typeof sections)[number];

export type SectionType = RegisteredDef["type"];
export const SECTION_TYPES = (sections as readonly AnySectionDef[]).map((def) => def.type) as SectionType[];

export type SectionContent<T extends SectionType = SectionType> = z.output<Extract<RegisteredDef, { type: T }>["schema"]>;

/** One section; `type` narrows `content`. `id` is stable, so the editor can reorder and select. */
export type Section = {
  [T in SectionType]: { id: string; type: T; hidden?: boolean; content: SectionContent<T> };
}[SectionType];

/** Parses stored sections, dropping unknown types and filling missing fields. */
export const parseSections = (value: unknown) => parse(value) as Section[];

/** The editor label of a section type. */
export const sectionLabel = (type: SectionType): TranslatableText => getSection(type)?.label ?? type;

/** A newly added section, with the type's defaults for `locale`. */
export const emptySection = (type: SectionType, locale = "en") => newSection(type, locale) as Section;

/** A blank item for the list at `path` (a content path), or null if it isn't a list that can grow. */
export const blankListItem = (type: SectionType, path: string) => blankItem(type, path);

/** Save-time check of submitted sections against the registered types; see validateSections in the site module. */
export const validateSections = (value: unknown) => validate(value, { types: SECTION_TYPES });

/** "FAQ › Questions › Question 2 › Answer" for a content path inside a section of this type. */
export function describeContentPath(type: string, path: (string | number)[], locale: string): string {
  const def = getSection(type);
  const resolve = (label: TranslatableText) => resolveLabel(label, locale);
  const section = def ? resolve(def.label) : type;
  return [section, ...(def ? labelPath(def.schema, path, resolve) : path.map(String))].join(" › ");
}
