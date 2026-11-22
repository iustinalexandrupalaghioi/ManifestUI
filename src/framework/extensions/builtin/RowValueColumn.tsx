"use client";

import { ServerIcon } from "lucide-react";
import { z } from "zod";
import { defineColumnComponent } from "@/framework/extensions";

/**
 * A value the server reads with each row that isn't a table column: a resource's server rules
 * add it (`select` in config/hooks.ts), e.g. a title taken from JSON or a name from another table.
 */
export const rowValueColumn = defineColumnComponent({
  type: "rowValue",
  label: { en: "Value the server adds (server rules)", ro: "Valoare adăugată de server (reguli de server)" },
  icon: ServerIcon,
  props: z.object({
    field: z.string().default("").describe("The value's name in config/hooks.ts select"),
  }),
  value: (row: Record<string, unknown>, { props }) => row[props.field] ?? null,
});
