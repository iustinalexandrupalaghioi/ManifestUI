/**
 * The blocks editor's operations, as pure functions over the stored list
 * (`{ id, type, hidden?, content }[]`): ids are kept on reorder and new on
 * duplicate, new blocks start from the block's defaults for the entry's
 * locale. React-free, so they're tested directly.
 */
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { newBlock, newBlockId, type AnyBlockDef, type StoredBlock } from "./blocks";

/** Inserts a new block of `def` at `index` (the end when omitted). */
export function addBlock(list: readonly StoredBlock[], def: AnyBlockDef, locale: string, index = list.length): StoredBlock[] {
  const at = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, at), newBlock(def, locale), ...list.slice(at)];
}

/** Moves the block at `from` to `to`; ids and content stay as they are. */
export function moveBlock(list: readonly StoredBlock[], from: number, to: number): StoredBlock[] {
  if (from === to || from < 0 || from >= list.length) return [...list];
  const next = [...list];
  const [block] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, block);
  return next;
}

/** A copy of the block at `index`, right after it, with a new id. */
export function duplicateBlock(list: readonly StoredBlock[], index: number): StoredBlock[] {
  const block = list[index];
  if (!block) return [...list];
  const copy: StoredBlock = { ...structuredClone(block), id: newBlockId() };
  return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
}

/** Hides a visible block (left out of reads, kept in the page) or shows a hidden one. */
export function toggleBlockHidden(list: readonly StoredBlock[], index: number): StoredBlock[] {
  return list.map((block, at) => {
    if (at !== index) return block;
    const { hidden, ...rest } = block;
    return hidden ? rest : { ...rest, hidden: true };
  });
}

export function removeBlock(list: readonly StoredBlock[], index: number): StoredBlock[] {
  return list.filter((_, at) => at !== index);
}

/** The Add block picker's choices: only the field's allowed blocks, filtered by label, description or type. */
export function pickerBlocks(allowed: readonly AnyBlockDef[], search: string, locale: string): AnyBlockDef[] {
  const needle = search.trim().toLowerCase();
  if (!needle) return [...allowed];
  return allowed.filter((def) =>
    [resolveLabel(def.label, locale), def.description ? resolveLabel(def.description, locale) : "", def.type].some((text) =>
      text.toLowerCase().includes(needle),
    ),
  );
}
