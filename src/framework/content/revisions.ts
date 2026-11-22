/**
 * Content revisions ("versions") and drafts are each one resource for every content type:
 * the published versions of a row (the History tab on each content type's record page) and
 * the unpublished changes waiting to go live.
 *
 * Their permissions follow the content types, never granted: whoever can read a content type
 * can read its versions and drafts (`content-revisions:read`, `content-drafts:read`), and
 * whoever can edit one may restore versions (`content-revisions:restore`) and discard drafts
 * (`content-drafts:discard`): the action and the server still check update on the row's own type.
 */
export const CONTENT_REVISIONS = "content-revisions";
export const CONTENT_DRAFTS = "content-drafts";

/** Resources whose permissions are derived from the content types (not offered for granting). */
export const DERIVED_CONTENT_RESOURCES: readonly string[] = [CONTENT_REVISIONS, CONTENT_DRAFTS];

/** The permissions a user gets for versions and drafts, given their permissions on the content types. */
export function derivedRevisionPermissions(permissions: readonly string[], contentResourceIds: readonly string[]): string[] {
  const any = (action: string) => contentResourceIds.some((id) => permissions.includes(`${id}:${action}`));
  return [
    ...(any("read") ? [`${CONTENT_REVISIONS}:read`, `${CONTENT_DRAFTS}:read`] : []),
    ...(any("update") ? [`${CONTENT_REVISIONS}:restore`, `${CONTENT_DRAFTS}:discard`] : []),
  ];
}
