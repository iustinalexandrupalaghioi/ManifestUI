import "server-only";

import { unstable_cache, updateTag } from "next/cache";

/**
 * Cached reads for the public site. Reads are tagged; saves expire exactly
 * the tags they touch (after the transaction commits), so the next visitor
 * gets the new version. Anything changed outside the CMS (seeding, SQL)
 * shows up within `SAFETY_NET` seconds.
 */
const SAFETY_NET = 60 * 60;

/** Caches `load` under `key`, tagged with `tags`. */
export function cachedRead<T>(key: string[], tags: string[], load: () => Promise<T>): Promise<T> {
  return unstable_cache(load, key, { tags, revalidate: SAFETY_NET })();
}

/** The cache tag of a collection's items (every locale). */
export const collectionTag = (name: string) => `collection:${name}`;

/** After saving a collection's records (add, edit, delete): refreshes every page that shows the collection. */
export function refreshCollection(name: string) {
  updateTag(collectionTag(name));
}
