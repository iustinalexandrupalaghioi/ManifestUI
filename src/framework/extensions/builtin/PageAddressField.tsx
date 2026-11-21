"use client";

import { LinkIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { z } from "zod";
import { defineFieldComponent } from "@/framework/extensions";

const TEXT = {
  en: {
    hint: "The end of the page's web address: lowercase letters, numbers and dashes.",
    example: "Example: privacy-policy is shown at /en/privacy-policy and /ro/privacy-policy.",
  },
  ro: {
    hint: "Finalul adresei web a paginii: litere mici, cifre și cratime.",
    example: "Exemplu: privacy-policy apare la /en/privacy-policy și /ro/privacy-policy.",
  },
};

/**
 * The URL part of a site page (`site_page.slug`), shown with the language
 * prefix it lives under so editors see where the page will appear.
 */
export const pageAddressField = defineFieldComponent({
  type: "pageAddress",
  label: { en: "Page address", ro: "Adresa paginii" },
  icon: LinkIcon,
  props: z.object({
    placeholder: z.string().default("privacy-policy").describe("Example shown when empty"),
    prefix: z.string().default("/en | /ro /").describe("Address shown before the value"),
  }),
  component: ({ id, value, onChange, onBlur, disabled, readOnly, props }) => {
    const t = TEXT[useLocale() === "ro" ? "ro" : "en"];
    const text = typeof value === "string" ? value : "";
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex h-9 items-center overflow-hidden rounded-md border bg-background focus-within:ring-3 focus-within:ring-ring/50">
          <span aria-hidden className="flex h-full items-center border-r bg-muted px-2.5 font-mono text-xs text-muted-foreground">
            {props.prefix}
          </span>
          <input
            id={id}
            value={text}
            onChange={(event) => onChange(event.target.value.toLowerCase().replace(/\s+/g, "-"))}
            onBlur={onBlur}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={props.placeholder}
            aria-describedby={`${id}-hint`}
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm outline-none"
          />
        </div>
        <p id={`${id}-hint`} className="m-0 text-xs text-muted-foreground">
          {t.hint} {props.prefix === "/en | /ro /" ? t.example : ""}
        </p>
      </div>
    );
  },
});
