import { cn } from "@/framework/lib/utils"

const SectionCard = ({
  title,
  children,
  className,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) => (
  <div className={cn("relative rounded-2xl border p-4", className)}>
    <div className="absolute -top-3 left-3 text-sm font-medium text-muted-foreground">
      {title}
    </div>
    {children}
  </div>
)

export default SectionCard
