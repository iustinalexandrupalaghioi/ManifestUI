export const AVATAR_BUCKET = "avatars";

// The `avatars` bucket is private — uploaded pictures are only readable
// through /api/avatars/[userId] (src/app/api/avatars/[userId]/route.ts),
// which enforces "own avatar, or users:read permission" before streaming
// the file via the service-role client. So this can't build a Supabase
// storage URL directly the way a public bucket would; it points at that
// route instead. `avatar_path` doubles as a cache-busting version tag —
// each upload gets a fresh random path, so the URL below is safe to cache
// aggressively (see the route's Cache-Control) without ever going stale.
//
// A user-uploaded picture (avatar_path) always wins over the OAuth
// provider's picture (avatar_url, synced from auth.users by the webhook)
// when both are present. avatar_url itself is left as-is — it's already a
// public URL hosted by the OAuth provider (Google, etc.), not something we
// control access to.
export function resolveAvatarUrl(profile: {
  id: string;
  avatar_path: string | null;
  avatar_url: string | null;
}): string | null {
  if (profile.avatar_path) {
    return `/api/avatars/${profile.id}?v=${encodeURIComponent(profile.avatar_path)}`;
  }
  return profile.avatar_url;
}
