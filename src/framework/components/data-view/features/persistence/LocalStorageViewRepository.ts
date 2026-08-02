import type { ViewRepository } from "./persistence.contract"
import type { PersistedViewState } from "../views/views.types"

export class LocalStorageViewRepository implements ViewRepository {
  loadSync(tableId: string): PersistedViewState | null {
    try {
      const raw = localStorage.getItem(`table-views:${tableId}`)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (parsed.tableViews && parsed.listViews) {
        return parsed as PersistedViewState
      }
      return null
    } catch {
      return null
    }
  }

  async load(tableId: string): Promise<PersistedViewState | null> {
    return this.loadSync(tableId)
  }

  async save(tableId: string, state: PersistedViewState): Promise<void> {
    try {
      localStorage.setItem(`table-views:${tableId}`, JSON.stringify(state))
    } catch {}
  }
}
