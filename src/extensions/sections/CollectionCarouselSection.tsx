import { z } from "zod";
import { defineSection, sectionData, text, type CollectionCard } from "@/modules/site";
import { Band, SectionHeading } from "@/components/site/sections/blocks";
import { Carousel } from "@/components/site/Carousel";
import { CollectionCardView } from "@/components/site/CollectionCard";
import { collectionField, EmptyCollectionHint, limitField, pickCards } from "./collectionFields";
import { eyebrowField, L, titleField } from "./fields";

/** Cards from a collection that scroll sideways, with arrows; kept in sync with the CMS. */
export const collectionCarouselSection = defineSection({
  type: "collectionCarousel",
  label: L("Collection carousel", "Carusel din colecție"),
  schema: z.object({
    eyebrow: eyebrowField(),
    title: titleField(),
    intro: text({ label: L("Intro", "Introducere"), multiline: true }),
    collection: collectionField(),
    limit: limitField(),
  }),
  defaults: { en: { title: "Our services" }, ro: { title: "Serviciile noastre" } },
  data: sectionData<Record<string, CollectionCard[]>>(),
  component: ({ id, content, data }) => {
    const cards = pickCards(data, content.collection, content.limit);
    return (
      <Band labelledBy={`${id}-title`} className="bg-surface">
        <SectionHeading titleId={`${id}-title`} introPath="intro" />
        {cards.length > 0 && (
          // The carousel stays a carousel in the editor: the cards aren't edited on the page anyway.
          <Carousel label={content.title}>
            {cards.map((card) => (
              <CollectionCardView key={card.id} card={card} tag="article" />
            ))}
          </Carousel>
        )}
        <EmptyCollectionHint collection={content.collection} count={cards.length} />
      </Band>
    );
  },
});
