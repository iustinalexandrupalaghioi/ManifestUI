import type { BlockProps } from "@/framework/content/ui/RenderBlocks";
import type { featuresBlock } from "@/content/blocks/features";
import { Band, SectionHeading } from "@/components/site/sections/blocks";
import { RevealGroup, RevealItem } from "@/components/site/landing/motion";

/** A heading and a grid of short points. */
export function Features({ id, content: c, field }: BlockProps<typeof featuresBlock>) {
  return (
    <Band labelledBy={`${id}-title`}>
      <SectionHeading titleId={`${id}-title`} eyebrow={c.eyebrow} title={c.title} intro={c.intro} field={field} />
      <RevealGroup as="ul" className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {c.items.map((item, i) => (
          <RevealItem key={i} as="li" className="flex flex-col gap-2 rounded-2xl border bg-card p-6">
            <h3 className="m-0 font-display text-lg font-semibold" {...field("items", i, "title")}>
              {item.title}
            </h3>
            <p className="m-0 text-base leading-relaxed text-muted-foreground" {...field("items", i, "body")}>
              {item.body}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </Band>
  );
}
