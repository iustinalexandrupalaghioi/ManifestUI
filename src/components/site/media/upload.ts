"use client";

import { createClient } from "@/lib/supabase/client";
import { createSiteMediaUpload } from "./actions";
import { SITE_MEDIA_BUCKET, type MediaKind } from "./types";

export interface UploadedMedia {
  src: string;
  width: number;
  height: number;
}

/** Natural size of an image or video file, read in the browser. */
function measure(file: File, kind: MediaKind): Promise<{ width: number; height: number }> {
  if (kind === "captions") return Promise.resolve({ width: 0, height: 0 });
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const done = (width: number, height: number) => {
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    if (kind === "image") {
      const img = new Image();
      img.onload = () => done(img.naturalWidth, img.naturalHeight);
      img.onerror = () => done(0, 0);
      img.src = url;
    } else {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => done(video.videoWidth, video.videoHeight);
      video.onerror = () => done(0, 0);
      video.src = url;
    }
  });
}

/**
 * Uploads a site media file: the server checks permission and signs the
 * upload, then the file goes straight to Supabase Storage. Returns the public
 * URL and the file's natural size. Throws an error code on failure.
 */
export async function uploadSiteMedia(file: File, kind: MediaKind, options: { resource?: string } = {}): Promise<UploadedMedia> {
  const contentType = file.type || (file.name.endsWith(".vtt") ? "text/vtt" : "");
  const signed = await createSiteMediaUpload({ kind, fileName: file.name, contentType, size: file.size, resource: options.resource });
  if (!signed.ok) throw new Error(signed.error);
  const { error } = await createClient()
    .storage.from(SITE_MEDIA_BUCKET)
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType, upsert: false });
  if (error) throw new Error("upload");
  const size = await measure(file, kind);
  return { src: signed.publicUrl, ...size };
}
