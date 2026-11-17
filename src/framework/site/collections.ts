/**
 * Collections: CMS resources shown on the website (services, projects,
 * posts…). This client-safe part names a collection; its server part
 * (`defineCollectionSource` in "@/framework/site/server") says which table it
 * reads and how a row becomes a card. Sections show collections by name.
 */
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { MediaValue } from "./sections/fields";

/** How a collection item appears in sections: the same shape for every collection. */
export interface CollectionCard {
  id: string;
  title: string;
  text: string;
  image: MediaValue;
  /** The item's page on the site, or "" when the collection has no detail pages. */
  href: string;
  /** The item in the CMS, for the editor's "Edit in CMS" link. */
  editHref: string;
}

export interface CollectionDef<TName extends string = string> {
  /** Stored in section content (which collection a section shows); never rename it. */
  name: TName;
  label: TranslatableText;
}

export function defineCollection<const TName extends string>(def: CollectionDef<TName>): CollectionDef<TName> {
  return def;
}

const registry = new Map<string, CollectionDef>();

/** Registers collections, in the order sections list them. */
export function registerCollections<const T extends readonly CollectionDef[]>(defs: T): T {
  for (const def of defs) registry.set(def.name, def);
  return defs;
}

export const getCollection = (name: string) => registry.get(name);
export const listCollections = () => [...registry.values()];
