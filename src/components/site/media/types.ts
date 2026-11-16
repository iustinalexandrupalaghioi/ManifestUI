/** Public Supabase Storage bucket for site images, videos and captions. */
export const SITE_MEDIA_BUCKET = "site-media";

export type MediaKind = "image" | "video" | "captions";

/** What each media field accepts. */
export const MEDIA_TYPES: Record<MediaKind, { mime: string[]; accept: string; maxBytes: number }> = {
  image: {
    mime: ["image/webp", "image/avif", "image/png", "image/jpeg", "image/gif"],
    accept: "image/webp,image/avif,image/png,image/jpeg,image/gif",
    maxBytes: 8 * 1024 * 1024,
  },
  video: {
    mime: ["video/mp4", "video/webm"],
    accept: "video/mp4,video/webm",
    maxBytes: 50 * 1024 * 1024,
  },
  captions: {
    mime: ["text/vtt"],
    accept: ".vtt,text/vtt",
    maxBytes: 512 * 1024,
  },
};
