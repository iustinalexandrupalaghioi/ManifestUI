"use client"

import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"
import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useCoreStore } from "../../../core/stores/DataViewStore"

/**
 * QuickSearchButton
 *
 * Self-contained search-toggle button. Replaces the near-identical inline
 * block previously duplicated in TableViewLayout/ListViewLayout.
 */
export function QuickSearchButton() {
  const { tableId } = useDataViewCore()
  const searchOpen = useCoreStore(tableId, (s) => s.searchOpen)
  const setSearchOpen = useCoreStore(tableId, (s) => s.setSearchOpen)
  const setGlobalFilter = useCoreStore(tableId, (s) => s.setGlobalFilter)

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => {
        setSearchOpen(!searchOpen)
        if (searchOpen) setGlobalFilter("")
      }}
    >
      <SearchIcon className="h-4 w-4" />
    </Button>
  )
}
