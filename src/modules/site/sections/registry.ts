import type { SectionDef } from "./define";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySectionDef = SectionDef<string, any, any>;

const registry = new Map<string, AnySectionDef>();

/** Registers section types, in the order the editor's "Add section" lists them. */
export function registerSections<const T extends readonly AnySectionDef[]>(defs: T): T {
  for (const def of defs) {
    const existing = registry.get(def.type);
    if (existing && existing !== def && process.env.NODE_ENV !== "production")
      console.warn(`[sections] "${def.type}" is already registered.`);
    registry.set(def.type, def);
  }
  return defs;
}

export const getSection = (type: string) => registry.get(type);
export const listSections = () => [...registry.values()];
