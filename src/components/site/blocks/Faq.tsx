import { ChevronDownIcon } from "lucide-react";
import type { BlockProps } from "@/framework/content/ui/RenderBlocks";
import type { faqBlock } from "@/content/blocks/faq";
import { Band, SectionHeading } from "@/components/site/sections/blocks";

/** Questions and answers, as collapsible rows next to the section title. */
export function Faq({ id, content, field }: BlockProps<typeof faqBlock>) {
  return (
    <Band id="faq" labelledBy={`${id}-title`} containerClassName="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
      <SectionHeading titleId={`${id}-title`} eyebrow={content.eyebrow} title={content.title} field={field} />
      <div className="flex flex-col divide-y rounded-2xl border bg-card">
        {content.items.map((item, i) => (
          <details key={i} className="group px-5">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-4 [&::-webkit-details-marker]:hidden">
              <h3 className="m-0 flex-1 font-display text-lg font-semibold" {...field("items", i, "q")}>
                {item.q}
              </h3>
              <ChevronDownIcon aria-hidden className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="m-0 pb-5 text-base leading-relaxed whitespace-pre-line text-muted-foreground" {...field("items", i, "a")}>
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </Band>
  );
}
