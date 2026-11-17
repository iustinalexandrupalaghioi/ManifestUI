import { z } from "zod";
import { defineSection, sectionData, text, type CollectionCard } from "@/modules/site";
import { Band, SectionHeading } from "@/components/site/sections/blocks";
import { CollectionCardView } from "@/components/site/CollectionCard";
import { collectionField, EmptyCollectionHint, limitField, pickCards } from "./collectionFields";
import { eyebrowField, L, titleField } from "./fields";

/** A heading and a grid of cards from a collection (services, projects…), kept in sync with the CMS. */
export const collectionCardsSection = defineSection({
  type: "collectionCards",
  label: L("Collection cards", "Carduri din colecție"),
  schema: z.object({
    eyebrow: eyebrowField(),
    title: titleField(),
    intro: text({ label: L("Intro", "Introducere"), multiline: true }),
    collection: collectionField(),
    limit: limitField(),
  }),
  defaults: { en: { title: "What we do" }, ro: { title: "Ce facem" } },
  data: sectionData<Record<string, CollectionCard[]>>(),
  component: ({ id, content, data }) => {
    const cards = pickCards(data, content.collection, content.limit);
    return (
      <Band labelledBy={`${id}-title`}>
        <SectionHeading titleId={`${id}-title`} introPath="intro" />
        {cards.length > 0 && (
          <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <CollectionCardView key={card.id} card={card} />
            ))}
          </ul>
        )}
        <EmptyCollectionHint collection={content.collection} count={cards.length} />
      </Band>
    );
  },
});
