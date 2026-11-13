import type { StorageRepository } from "./persistence.contract"

export class LocalStorageRepository implements StorageRepository {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {}
  }
}
