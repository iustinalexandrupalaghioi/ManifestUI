"use server";

import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { hasServerPermission } from "@/framework/authorization/lib/permissions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { MEDIA_TYPES, type MediaKind } from "@/framework/content/media";
import { SITE_MEDIA_BUCKET } from "./types";

type Result = { ok: true; path: string; token: string; publicUrl: string } | { ok: false; error: string };

/**
 * Starts an upload of a site image, video or captions file: checks that the
 * caller may edit site content (or, with `resource`, add or edit that
 * resource's records, e.g. a collection's images), makes sure the public `site-media` bucket
 * exists, and returns a signed upload URL token. The browser then uploads
 * the file straight to Supabase Storage (no server-action size limit).
 */
export async function createSiteMediaUpload(input: {
  kind: MediaKind;
  fileName: string;
  contentType: string;
  size: number;
  resource?: string;
}): Promise<Result> {
  const userId = await getCurrentUserId();
  const resource = typeof input.resource === "string" && /^[a-z0-9-]{1,60}$/.test(input.resource) ? input.resource : null;
  const allowed = ["site-pages:update", "services:update", ...(resource ? [`${resource}:add`, `${resource}:update`] : [])];
  if (!(await hasServerPermission(userId, allowed))) {
    return { ok: false, error: "forbidden" };
  }
  const rule = MEDIA_TYPES[input.kind];
  if (!rule || !rule.mime.includes(input.contentType)) return { ok: false, error: "type" };
  if (!(input.size > 0) || input.size > rule.maxBytes) return { ok: false, error: "size" };

  const admin = getSupabaseAdmin();
  const { data: bucket } = await admin.storage.getBucket(SITE_MEDIA_BUCKET);
  if (!bucket) {
    const { error } = await admin.storage.createBucket(SITE_MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: Math.max(...Object.values(MEDIA_TYPES).map((r) => r.maxBytes)),
      allowedMimeTypes: Object.values(MEDIA_TYPES).flatMap((r) => r.mime),
    });
    if (error && !/already exists/i.test(error.message)) {
      console.error("Could not create the site-media bucket", error);
      return { ok: false, error: "bucket" };
    }
  }

  const safeName = input.fileName.split(/[/\\]/).pop()!.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
  const path = `${input.kind}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await admin.storage.from(SITE_MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("Could not create a signed upload URL", error);
    return { ok: false, error: "upload" };
  }
  const publicUrl = admin.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  return { ok: true, path: data.path, token: data.token, publicUrl };
}
