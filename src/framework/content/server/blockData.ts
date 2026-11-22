import "server-only";

/**
 * Server data for blocks that need more than their content (lessons from the
 * database, generated code…). A loader belongs to a block type; a page runs
 * the loaders of the block types it shows (once per type, in parallel) and
 * passes the results to RenderBlocks as `data`.
 */
import type { AnyBlockDef } from "../blocks";

export interface BlockLoadContext {
  locale: string;
}

export interface BlockLoader {
  type: string;
  load: (context: BlockLoadContext) => unknown;
}

/** The server loader for a block type; its component receives the result as `data`. */
export function defineBlockLoader<TData>(block: AnyBlockDef, load: (context: BlockLoadContext) => TData | Promise<TData>): BlockLoader {
  return { type: block.type, load };
}

/** Runs the loaders for the given block types; `.all` runs every loader (the preview can show any block). */
export function createBlockDataLoader(loaders: readonly BlockLoader[]) {
  const byType = new Map(loaders.map((loader) => [loader.type, loader.load]));
  const load = async (types: Iterable<string>, context: BlockLoadContext): Promise<Record<string, unknown>> => {
    const wanted = [...new Set(types)].filter((type) => byType.has(type));
    return Object.fromEntries(await Promise.all(wanted.map(async (type) => [type, await byType.get(type)!(context)] as const)));
  };
  return Object.assign(load, { all: (context: BlockLoadContext) => load(byType.keys(), context) });
}
