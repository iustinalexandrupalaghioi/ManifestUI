"use client";

import { StarIcon } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { defineFieldComponent } from "@/framework/extensions";

export const ratingField = defineFieldComponent({
  type: "rating",
  label: { en: "Rating", ro: "Evaluare" },
  icon: StarIcon,
  props: z.object({
    max: z.number().int().min(1).max(10).default(5).describe("Number of stars"),
    allowClear: z.boolean().default(true).describe("Clicking the current value clears it"),
  }),
  component: ({ id, value, onChange, onBlur, disabled, readOnly, props }) => {
    const current = typeof value === "number" ? value : 0;
    const locked = disabled || readOnly;
    return (
      <div id={id} role="radiogroup" className="flex h-10 items-center gap-0.5" onBlur={onBlur}>
        {Array.from({ length: props.max }, (_, index) => {
          const score = index + 1;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={current === score}
              aria-label={String(score)}
              disabled={locked}
              onClick={() => onChange(props.allowClear && current === score ? 0 : score)}
              className="rounded-sm p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
            >
              <StarIcon
                className={cn(
                  "size-5",
                  score <= current ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                )}
              />
            </button>
          );
        })}
      </div>
    );
  },
});
