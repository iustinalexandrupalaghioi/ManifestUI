"use client"

import { Input } from "@/components/ui/input"
import { SearchIcon, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useCoreStore } from "../../../core/stores/DataViewStore"

/**
 * QuickSearchInput
 *
 * Self-contained search input, shown when searchOpen is true. Replaces the
 * near-identical inline block previously duplicated in
 * TableViewLayout/ListViewLayout.
 */
export function QuickSearchInput() {
  const t = useTranslations("DataView")
  const { tableId } = useDataViewCore()
  const searchOpen = useCoreStore(tableId, (s) => s.searchOpen)
  const globalFilter = useCoreStore(tableId, (s) => s.globalFilter)
  const setGlobalFilter = useCoreStore(tableId, (s) => s.setGlobalFilter)

  if (!searchOpen) return null

  return (
    <div className="relative mb-2">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
      </span>
      <Input
        autoFocus
        placeholder={t("quickSearch")}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="pr-8 pl-10"
      />
      {globalFilter && (
        <button
          type="button"
          onClick={() => setGlobalFilter("")}
          className="absolute inset-y-0 right-0 flex items-center pr-2"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </button>
      )}
    </div>
  )
}
