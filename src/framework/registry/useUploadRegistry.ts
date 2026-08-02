"use client"

import { useRef } from "react"
import type { UploadRegistry, UploadEntry } from "./UploadRegistryContext"

export function useUploadRegistry(): UploadRegistry {
  const entries = useRef<Map<string, UploadEntry>>(new Map())

  const register = (name: string, entry: UploadEntry) => {
    entries.current.set(name, entry)
  }

  const unregister = (name: string) => {
    entries.current.delete(name)
  }

  const runAll = async (
    id: number | string,
    data: Record<string, unknown>
  ): Promise<Record<string, string>> => {
    const patches: Record<string, string> = {}
    for (const [, entry] of entries.current) {
      const existingPath = data[entry.pathField] as string | undefined
      const result = await entry.handleOperation(id, existingPath)
      if (result.action === "uploaded" || result.action === "deleted") {
        patches[entry.pathField] = result.path ?? ""
      }
    }
    return patches
  }

  const resetAll = () => {
    for (const [, entry] of entries.current) {
      entry.reset()
    }
  }

  const snapshot = (): UploadEntry[] => {
    return Array.from(entries.current.values())
  }

  return { register, unregister, runAll, resetAll, snapshot }
}
