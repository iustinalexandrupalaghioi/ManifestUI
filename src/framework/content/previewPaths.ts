/**
 * Field paths between the CMS form and the preview frame. The form names a
 * block by its index ("sections.3.content.items.0.q"); the preview by its id
 * ("sections[b_x7k2].items.0.q"), so a path survives reordering. Blocks fields
 * may sit at any depth. Pure, React-free.
 */

const isBlockList = (value: unknown): value is { id: string; type: string }[] =>
  Array.isArray(value) && value.every((item) => !!item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string" && "type" in item);

/** "sections.3.content.items.0.q" → "sections[b_x7k2].items.0.q" (values: the form's current values). */
export function toPreviewPath(formName: string, values: unknown): string {
  const parts = formName.split(".");
  const out: string[] = [];
  let current: unknown = values;
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    const next = (current as Record<string, unknown> | undefined)?.[part];
    if (isBlockList(next) && /^\d+$/.test(parts[index + 1] ?? "")) {
      const block = next[Number(parts[index + 1])];
      out.push(`${part}[${block?.id ?? parts[index + 1]}]`);
      // Skip the index, and the block's "content" key (paths inside a block start at its fields).
      index += parts[index + 2] === "content" ? 2 : 1;
      current = (block as { content?: unknown } | undefined)?.content;
      continue;
    }
    out.push(part);
    current = next;
  }
  return out.join(".");
}

/** "sections[b_x7k2].items.0.q" → "sections.3.content.items.0.q", or null when the block is gone. */
export function toFormName(previewPath: string, values: unknown): string | null {
  const out: string[] = [];
  let current: unknown = values;
  for (const segment of previewPath.split(".")) {
    const match = /^(.+)\[([^\]]+)\]$/.exec(segment);
    if (match) {
      const [, field, id] = match;
      const list = (current as Record<string, unknown> | undefined)?.[field];
      if (!isBlockList(list)) return null;
      const index = list.findIndex((block) => block.id === id);
      if (index < 0) return null;
      out.push(field, String(index), "content");
      current = (list[index] as { content?: unknown }).content;
      continue;
    }
    out.push(segment);
    current = (current as Record<string, unknown> | undefined)?.[segment];
  }
  return out.join(".");
}

/**
 * After a save, the preview frame reloads unless its page reported itself
 * ready (it uses the preview helper and already shows the draft live).
 */
export const frameNeedsReload = (ready: boolean) => !ready;
