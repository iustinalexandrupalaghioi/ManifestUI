/**
 * Cache tags of content reads. The content layer tags every read with its
 * type and each entry it returns (and the types it references); publishing
 * refreshes the entry's and its type's tags.
 */
export const contentTag = (type: string) => `ct:${type}`;
export const entryTag = (type: string, entryId: string) => `ct:${type}:${entryId}`;

/** Everything read from a CMS resource's table; refreshed after every save of that resource. */
export const resourceTag = (resourceId: string) => `resource:${resourceId}`;
