import { Label } from "@/framework/components/ui/label"

const FormField = ({
  label,
  error,
  colSpan2,
  children,
}: {
  label: string
  error?: string
  colSpan2?: boolean
  children: React.ReactNode
}) => {
  return (
    <div className={`flex flex-col gap-1.5${colSpan2 ? "md:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export default FormField
