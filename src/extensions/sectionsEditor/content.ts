import { type Section } from "@/components/site/sections/model";
import { parseSiteSettings, SITE_SETTINGS_PARTS } from "@/components/site/settings/model";

/** Immutably sets a dotted path ("demo.1.image") inside section content. */
export function setAtPath(target: unknown, path: string[], value: unknown): unknown {
  if (!path.length) return value;
  const [key, ...rest] = path;
  if (Array.isArray(target)) {
    const next = [...target];
    next[Number(key)] = setAtPath(next[Number(key)], rest, value);
    return next;
  }
  const obj = (target ?? {}) as Record<string, unknown>;
  return { ...obj, [key]: setAtPath(obj[key], rest, value) };
}

export interface SectionProblem {
  /** Path from the sections array: [index, "content", ...]. */
  path: (string | number)[];
  message: string;
}

/** Flattens react-hook-form errors under `sections` into path + message pairs. */
export function collectProblems(node: unknown, path: (string | number)[] = [], out: SectionProblem[] = []): SectionProblem[] {
  if (!node || typeof node !== "object") return out;
  const record = node as Record<string, unknown>;
  if (typeof record.message === "string" && record.message && "type" in record) out.push({ path, message: record.message });
  for (const [key, child] of Object.entries(record)) {
    if (key === "ref" || key === "message" || key === "type" || key === "types") continue;
    collectProblems(child, key === "root" ? path : [...path, /^d+$/.test(key) ? Number(key) : key], out);
  }
  return out;
}

/** Site settings ({ header, footer }) as the editor's fixed list of sections, and back. */
export const settingsToSections = (value: unknown) => {
  const settings = parseSiteSettings(value);
  return SITE_SETTINGS_PARTS.map(({ id, def }) => ({ id, type: def.type, content: settings[id] })) as unknown as Section[];
};
export const sectionsToSettings = (sections: Section[]) =>
  Object.fromEntries(SITE_SETTINGS_PARTS.map(({ id }) => [id, sections.find((s) => s.id === id)?.content ?? {}]));
