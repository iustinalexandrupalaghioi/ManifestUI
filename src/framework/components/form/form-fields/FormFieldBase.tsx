"use client"

import { useId, useState, type ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/framework/lib/utils"
import { useFieldCollapse } from "./FieldCollapseContext"

interface FormFieldBaseProps {
  label: string
  id?: string
  error?: string
  className?: string
  children: ReactNode
}

export function FormFieldBase({
  label,
  id,
  error,
  className,
  children,
}: FormFieldBaseProps) {
  const { collapsible, defaultCollapsed } = useFieldCollapse()
  const [collapsed, setCollapsed] = useState(!!(collapsible && defaultCollapsed))
  const bodyId = useId()

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex w-fit items-center gap-1 rounded-sm text-left text-sm leading-none font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            error && "text-destructive",
          )}
        >
          <ChevronDownIcon
            className={cn("size-4 shrink-0 transition-transform", collapsed && "-rotate-90")}
          />
          {label}
        </button>
      ) : (
        <Label htmlFor={id} className={cn(error && "text-destructive")}>
          {label}
        </Label>
      )}
      {/* Kept mounted when collapsed so focus/validation still reach the input. */}
      <div id={bodyId} className={cn("contents", collapsed && "hidden")}>
        {children}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
