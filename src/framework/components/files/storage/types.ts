export interface UploadProgressEvent {
  loaded: number
  total: number
  percentage: number
}

export type UploadStatus = "idle" | "uploading" | "done" | "error"

export interface UploadedFile {
  id: string
  file: File
  url?: string
  storagePath?: string
  status: UploadStatus
  progress: number
  error?: string
}

export interface StorageHandler {
  upload: (
    file: File,
    options: {
      bucket: string
      path?: string
      onProgress?: (event: UploadProgressEvent) => void
    }
  ) => Promise<{ url: string; path: string }>

  remove: (options: { bucket: string; path: string }) => Promise<void>

  getPublicUrl: (options: { bucket: string; path: string }) => string

  // Only meaningful for a bucket that is NOT marked public in Supabase
  // Storage — `getPublicUrl` returns a permanently-valid URL regardless of
  // bucket ACLs, so anything sensitive must be served through this instead.
  getSignedUrl: (options: {
    bucket: string
    path: string
    expiresInSeconds?: number
  }) => Promise<string>
}
