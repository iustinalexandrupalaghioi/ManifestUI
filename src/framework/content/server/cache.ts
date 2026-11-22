import "server-only";

import { unstable_cache, updateTag } from "next/cache";
import { resourceTag } from "../tags";

export { resourceTag };

/**
 * Cached reads for content. Reads are tagged; saves expire exactly the tags
 * they touch (after the transaction commits), so the next visitor gets the
 * new version. Anything changed outside the CMS (seeding, SQL) shows up
 * within `SAFETY_NET` seconds.
 */
const SAFETY_NET = 60 * 60;

/** Caches `load` under `key`, tagged with `tags`. */
export function cachedRead<T>(key: string[], tags: string[], load: () => Promise<T>): Promise<T> {
  return unstable_cache(load, key, { tags, revalidate: SAFETY_NET })();
}

/**
 * After a CMS resource's save commits: refreshes every read tagged with it.
 * The CMS calls this for every resource (src/app/[locale]/cms/createResourceActions.ts).
 */
export function refreshResource(resourceId: string) {
  updateTag(resourceTag(resourceId));
}
