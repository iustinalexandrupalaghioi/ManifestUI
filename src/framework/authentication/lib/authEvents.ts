/**
 * Browser event fired when the signed-in user's details change (profile or
 * avatar saved), for UI that loads them client-side, such as the public
 * site's navbar on static pages.
 */
export const AUTH_CHANGED_EVENT = "manifestui:auth-changed";

export function notifyAuthChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
