import { createClient } from "@/lib/supabase/client";
import type { StorageHandler } from "@/framework/components/files/storage/types";

interface SupabaseHandlerOptions {
  supabaseUrl: string;
  supabaseKey: string;
}

function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function createSupabaseHandler({
  supabaseUrl,
  supabaseKey,
}: SupabaseHandlerOptions): StorageHandler {
  const supabase = createClient();

  async function authHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      apikey: supabaseKey,
      Authorization: `Bearer ${session?.access_token ?? supabaseKey}`,
    };
  }

  return {
    async upload(file, { bucket, path, onProgress }) {
      const filePath =
        path ?? `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const headers = await authHeaders();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`,
        );

        Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.setRequestHeader("x-upsert", "true");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const body = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  `Upload failed: ${body?.error ?? body?.message ?? xhr.responseText}`,
                ),
              );
            } catch {
              reject(new Error(`Upload failed: ${xhr.responseText}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      return {
        url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`,
        path: filePath,
      };
    },

    async remove({ bucket, path }) {
      const headers = await authHeaders();
      const res = await fetch(
        `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
        { method: "DELETE", headers },
      );
      if (!res.ok) {
        const body = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(body?.message ?? `Delete failed: ${res.status}`);
      }
    },

    getPublicUrl({ bucket, path }) {
      return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    },

    async getSignedUrl({ bucket, path, expiresInSeconds = 3600 }) {
      const headers = await authHeaders();
      const res = await fetch(
        `${supabaseUrl}/storage/v1/object/sign/${bucket}/${path}`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ expiresIn: expiresInSeconds }),
        },
      );
      if (!res.ok) {
        const body = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(body?.message ?? `Failed to sign URL: ${res.status}`);
      }
      const { signedURL } = (await res.json()) as { signedURL: string };
      return `${supabaseUrl}/storage/v1${signedURL}`;
    },
  };
}
