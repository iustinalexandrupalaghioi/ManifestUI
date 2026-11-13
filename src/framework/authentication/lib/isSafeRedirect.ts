// `next.startsWith("/")` alone also matches protocol-relative URLs like
// "//evil.com" or "/\evil.com" (browsers resolve these as an external
// origin), and string-concatenation patterns like `${origin}${next}` can
// be broken out of with a leading "@" (e.g. "@evil.com" turns
// "https://app.com" + "@evil.com" into a URL whose host is "evil.com").
// Only allow a single-leading-slash internal path.
export function isSafeRedirect(
  next: string | null | undefined,
): next is string {
  return !!next && /^\/(?!\/|\\)/.test(next);
}
