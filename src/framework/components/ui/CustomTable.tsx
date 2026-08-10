import * as React from "react"

import { cn } from "@/framework/lib/utils"
import {
  TableHeader as CustomTableHeader,
  TableBody as CustomTableBody,
  TableFooter as CustomTableFooter,
  TableHead as CustomTableHead,
  TableRow as CustomTableRow,
  TableCell as CustomTableCell,
  TableCaption as CustomTableCaption,
} from "@/components/ui/table"

// Only the root differs from the shadcn base (no `table-container` wrapper
// div around `<table>`) — everything else below is re-exported as-is.
function CustomTable({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  )
}

export {
  CustomTable,
  CustomTableHeader,
  CustomTableBody,
  CustomTableFooter,
  CustomTableHead,
  CustomTableRow,
  CustomTableCell,
  CustomTableCaption,
}
