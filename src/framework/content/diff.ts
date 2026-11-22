/**
 * A field-by-field comparison of two versions of an entry, for History's
 * Compare: every leaf that differs, by readable path. Blocks are matched by
 * id, so a reordered page shows content changes rather than every block.
 * React-free.
 */

export interface FieldChange {
  /** "title", "sections[b_x7k2].items.0.q" */
  path: string;
  before: string | null;
  after: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isBlockList = (value: unknown): value is { id: string }[] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => isRecord(item) && typeof item.id === "string" && "type" in item);
const show = (value: unknown): string | null => (value === undefined || value === null ? null : typeof value === "string" ? value : JSON.stringify(value));

function walk(path: string, before: unknown, after: unknown, out: FieldChange[]) {
  if (isBlockList(before) || isBlockList(after)) {
    const list = (value: unknown) => (isBlockList(value) ? value : []);
    const beforeById = new Map(list(before).map((block) => [block.id, block]));
    const afterById = new Map(list(after).map((block) => [block.id, block]));
    for (const id of new Set([...beforeById.keys(), ...afterById.keys()])) walk(`${path}[${id}]`, beforeById.get(id), afterById.get(id), out);
    const order = (value: unknown) => list(value).map((block) => block.id).join(",");
    if (order(before) !== order(after) && beforeById.size === afterById.size) out.push({ path: `${path} (order)`, before: order(before), after: order(after) });
    return;
  }
  if (isRecord(before) || isRecord(after)) {
    const b = isRecord(before) ? before : {};
    const a = isRecord(after) ? after : {};
    for (const key of new Set([...Object.keys(b), ...Object.keys(a)])) walk(path ? `${path}.${key}` : key, b[key], a[key], out);
    return;
  }
  if (Array.isArray(before) || Array.isArray(after)) {
    const b = Array.isArray(before) ? before : [];
    const a = Array.isArray(after) ? after : [];
    for (let index = 0; index < Math.max(a.length, b.length); index++) walk(`${path}.${index}`, b[index], a[index], out);
    return;
  }
  // Empty, null and missing all read as empty: only real changes are listed.
  if ((show(before) ?? "") !== (show(after) ?? "")) out.push({ path, before: show(before), after: show(after) });
}

/**
 * The fields of `before` (a revision) that differ in `after` (what's being
 * edited). Only keys of the revision are compared, since form values carry
 * row-only keys (id, locale…) too.
 */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>): FieldChange[] {
  const out: FieldChange[] = [];
  for (const key of Object.keys(before)) walk(key, before[key], after[key], out);
  return out;
}
