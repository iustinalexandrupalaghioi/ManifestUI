"use client"

import { useState } from "react"
import type { FieldValues } from "react-hook-form"
import type { ResourceConfig, ResourceId } from "../../types/resource-hook-types"

export function createTabsHook<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(config: ResourceConfig<TItem, TFormValues, TId>) {
  const { tabs = [], defaultTab, defaultFormOpen = true } = config

  return function useDetailTabs() {
    const [formOpen, setFormOpen] = useState(defaultFormOpen)
    const [activeTab, setActiveTab] = useState(
      defaultTab ?? tabs[0]?.value ?? ""
    )

    return {
      formOpen,
      setFormOpen,
      activeTab,
      setActiveTab,
      tabs,
      hasTabs: tabs.length > 0,
    }
  }
}
