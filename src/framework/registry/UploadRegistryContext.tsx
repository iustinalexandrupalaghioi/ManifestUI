"use client"

import { createContext } from "react"

export interface UploadEntry {
  pathField: string
  handleOperation: (
    existingPath?: string
  ) => Promise<{ action: "uploaded" | "deleted" | "none"; path?: string }>
  reset: () => void
}

export interface UploadRegistry {
  register: (name: string, entry: UploadEntry) => void
  unregister: (name: string) => void
  runAll: (data: Record<string, unknown>) => Promise<Record<string, string>>
  resetAll: () => void
  snapshot: () => UploadEntry[]
}

export const UploadRegistryContext = createContext<UploadRegistry | null>(null)
