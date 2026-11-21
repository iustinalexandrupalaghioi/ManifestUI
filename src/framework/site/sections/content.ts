/**
 * Stored page content (`site_page.sections`) against the registered section
 * types: parsing, new sections and blank list items. Client-safe.
 */
import { newSectionContent } from "./define";
import { blankItemAt, strictSchema } from "./fields";
import { getSection } from "./registry";

/** One stored section. `id` is stable, so the editor can reorder and select. */
export interface StoredSection {
  id: string;
  type: string;
  hidden?: boolean;
  content: unknown;
}

/**
 * Parses stored sections, dropping unknown types and filling missing fields.
 * Missing, empty or duplicate ids are replaced (deterministically, so the same
 * stored value gives the same ids), so what opens always passes validateSections.
 */
export function parseSections(value: unknown): StoredSection[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((raw, index) => {
    const type = String(raw?.type ?? "");
    const def = getSection(type);
    if (!def) return [];
    const content = def.schema.parse(raw?.content ?? {});
    const base = typeof raw?.id === "string" && raw.id ? raw.id : `${type}-${index}`;
    let id = base;
    for (let n = 1; seen.has(id); n++) id = `${base}-${index}-${n}`;
    seen.add(id);
    return [{ id, type, hidden: !!raw?.hidden, content }];
  });
}

/** A problem in submitted sections; `path` starts at the sections array ([2, "content", "items", 0, "q"]). */
export interface SectionIssue {
  path: (string | number)[];
  message: string;
}

/**
 * Checks sections before they're saved: the array shape, unique ids, known
 * types and each section's content against its strict schema (no unknown
 * keys or wrong types; text constraints apply). Returns no issues when valid.
 */
export function validateSections(value: unknown, options: { types?: readonly string[] } = {}): SectionIssue[] {
  if (!Array.isArray(value)) return [{ path: [], message: "Sections must be a list" }];
  const issues: SectionIssue[] = [];
  const ids = new Set<string>();
  value.forEach((raw, index) => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      issues.push({ path: [index], message: "Each section must be an object" });
      return;
    }
    const { id, type, hidden, content, ...rest } = raw as Record<string, unknown>;
    for (const key of Object.keys(rest)) issues.push({ path: [index, key], message: `Unknown key "${key}"` });
    if (typeof id !== "string" || !id) issues.push({ path: [index, "id"], message: "Section id is required" });
    else if (ids.has(id)) issues.push({ path: [index, "id"], message: `Duplicate section id "${id}"` });
    else ids.add(id);
    if (hidden !== undefined && typeof hidden !== "boolean") issues.push({ path: [index, "hidden"], message: "Expected true or false" });
    const allowed = typeof type === "string" && (!options.types || options.types.includes(type));
    const def = allowed ? getSection(type) : undefined;
    if (!def) {
      issues.push({ path: [index, "type"], message: `Unknown section type "${String(type)}"` });
      return;
    }
    const result = strictSchema(def.schema).safeParse(content ?? {});
    if (!result.success)
      for (const issue of result.error.issues)
        issues.push({ path: [index, "content", ...issue.path.map((key) => (typeof key === "symbol" ? String(key) : key))], message: issue.message });
  });
  return issues;
}

/** A new section of a registered type, with its defaults for `locale`. */
export function newSection(type: string, locale = "en"): StoredSection {
  const def = getSection(type);
  if (!def) throw new Error(`Unknown section type "${type}".`);
  return { id: `${type}-${Math.random().toString(36).slice(2, 8)}`, type, content: newSectionContent(def, locale) };
}

/** A blank item for the list at `path` (a content path) of a section type, or null if it isn't a list that can grow. */
export function blankListItem(type: string, path: string): unknown {
  const def = getSection(type);
  return def ? blankItemAt(def.schema, path) : null;
}
