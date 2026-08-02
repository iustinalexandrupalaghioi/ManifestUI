import { Label } from "@/framework/components/ui/label"
import { cn } from "@/framework/lib/utils"
import type { ReactNode } from "react"

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
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
