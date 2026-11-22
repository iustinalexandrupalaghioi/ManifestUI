/**
 * What makes a resource a content type: its `content` options on the
 * resource descriptor. Plain data (plus an optional url function), so the
 * client (menus, toolbar, status columns) and the server read the same thing.
 */

/** The address parts a content URL is built from. */
export interface EntryAddress {
  locale: string;
  slug?: string;
}

export interface ContentOptions {
  /** The content type's name: what the content layer, references and links use ("page", "lesson"). */
  type: string;
  /** Many entries, or exactly one per locale (a "single entry" in the CMS). */
  kind: "collection" | "singleton";
  /** One row per locale, grouped by `entry_id`. */
  localized: boolean;
  /** The field holding the entry's address; unique per locale. */
  slugField?: string;
  /** The field shown in lists, references and history (collections). */
  titleField?: string;
  /**
   * The entry's public address: a pattern ("/{locale}/services/{slug}") or a
   * function. Used by link fields and the preview pane.
   */
  url?: string | ((entry: EntryAddress) => string);
  /** Shows the preview pane when the frontend has a preview route and `url` is set. */
  previewable?: boolean;
}

/** The public address of an entry, or null when its type has no `url`. */
export function entryUrl(options: Pick<ContentOptions, "url">, entry: EntryAddress): string | null {
  if (!options.url) return null;
  if (typeof options.url === "function") return options.url(entry);
  const path = options.url
    .replace(/\{locale\}/g, encodeURIComponent(entry.locale))
    .replace(/\{slug\}/g, entry.slug ? encodeURIComponent(entry.slug) : "");
  // A pattern whose slug part is empty ("/en/" for the home page) loses the trailing slash.
  return path.replace(/\/{2,}/g, "/").replace(/(.)\/$/, "$1");
}
