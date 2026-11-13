"use client";

import { InfoIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { z } from "zod";
import { defineBlockComponent } from "@/framework/extensions";

const formatValue = (value: unknown, locale: string) => {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "string" && !Number.isNaN(Date.parse(value)) && /\d{4}-\d{2}-\d{2}/.test(value))
    return new Date(value).toLocaleString(locale);
  return String(value);
};

export const recordInfoBlock = defineBlockComponent({
  type: "recordInfo",
  label: { en: "Record info", ro: "Informații înregistrare" },
  icon: InfoIcon,
  props: z.object({
    title: z.string().default("Record").describe("Heading shown above the values"),
    fields: z.string().default("id,created_at").describe("Comma-separated record properties"),
  }),
  component: function RecordInfo({ props, item }) {
    const locale = useLocale();
    if (!item) return null;
    const keys = props.fields.split(",").map((key) => key.trim()).filter(Boolean);
    return (
      <section className="rounded-lg border bg-muted/30 px-4 py-3">
        <h3 className="mb-2 text-sm font-medium">{props.title}</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {keys.map((key) => (
            <div key={key} className="contents">
              <dt className="font-mono text-xs text-muted-foreground">{key}</dt>
              <dd className="min-w-0 truncate">{formatValue(item[key], locale)}</dd>
            </div>
          ))}
        </dl>
      </section>
    );
  },
});
