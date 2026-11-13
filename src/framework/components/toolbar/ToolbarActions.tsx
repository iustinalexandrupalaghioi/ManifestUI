"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface ToolbarActionsProps {
  children: React.ReactNode
  slotId?: string
}

const ToolbarActions = ({
  children,
  slotId = "toolbar-slot",
}: ToolbarActionsProps) => {
  const [slot, setSlot] = useState<Element | null>(null)

  useEffect(() => {
    setSlot(document.getElementById(slotId))
  }, [slotId])

  if (!slot) return null
  return createPortal(children, slot)
}

export default ToolbarActions
