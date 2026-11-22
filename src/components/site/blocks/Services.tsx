import { useLocale } from "next-intl";
import type { BlockProps } from "@/framework/content/ui/RenderBlocks";
import type { servicesBlock } from "@/content/blocks/services";
import type { ServiceSummary } from "@/components/site/internal/services/content";
import { Band, SectionHeading } from "@/components/site/sections/blocks";
import { Carousel } from "@/components/site/Carousel";
import { ServiceCard, type ServiceCardContent } from "@/components/site/ServiceCard";
import { cmsHref } from "@/components/site/SiteLink";

const EMPTY_IMAGE = { src: "", width: 0, height: 0 };

/** The content layer resolves the references to entries; a live preview draft may still hold ids. */
const isEntry = (value: unknown): value is { entryId: string; title: string; url: string | null; data: Record<string, unknown> } =>
  !!value && typeof value === "object" && "entryId" in value;

const asImage = (value: unknown) =>
  value && typeof value === "object" && typeof (value as { src?: unknown }).src === "string"
    ? (value as ServiceCardContent["image"])
    : EMPTY_IMAGE;

/**
 * Services as cards or a carousel: the chosen ones, or every published service
 * (`data`, from the block's loader in ./data.ts) when none are chosen.
 */
export function Services({ id, content: c, data, field }: BlockProps<typeof servicesBlock, ServiceSummary[]>) {
  const locale = useLocale();
  const chosen = (c.entries as unknown[]).filter(isEntry);
  const cards: (ServiceCardContent & { key: string })[] = chosen.length
    ? chosen.map((entry) => ({
        key: entry.entryId,
        title: entry.title,
        summary: typeof entry.data.summary === "string" ? entry.data.summary : "",
        image: asImage(entry.data.image),
        href: entry.url ? cmsHref(entry.url, locale) : null,
      }))
    : (data ?? []).map((service) => ({
        key: service.entryId,
        title: service.title,
        summary: service.summary,
        image: service.image,
        href: `/services/${service.slug}`,
      }));

  return (
    <Band id="services" labelledBy={`${id}-title`}>
      <SectionHeading titleId={`${id}-title`} eyebrow={c.eyebrow} title={c.title} intro={c.intro} field={field} />
      {cards.length > 0 &&
        (c.layout === "carousel" ? (
          <Carousel label={c.title}>
            {cards.map(({ key, ...card }) => (
              <ServiceCard key={key} card={card} tag="div" />
            ))}
          </Carousel>
        ) : (
          <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3" {...field("entries")}>
            {cards.map(({ key, ...card }) => (
              <ServiceCard key={key} card={card} />
            ))}
          </ul>
        ))}
    </Band>
  );
}
