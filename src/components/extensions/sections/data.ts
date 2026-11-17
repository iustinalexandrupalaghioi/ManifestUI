import "server-only";

import { createSectionDataLoader, defineSectionLoader } from "@/framework/site/server";
import { loadCollections } from "@/components/extensions/collections/data";
import { collectionCardsSection } from "./CollectionCardsSection";
import { collectionCarouselSection } from "./CollectionCarouselSection";

/**
 * Server data for the sections that need more than their content (database
 * records…): add `defineSectionLoader(section, ({ locale }) => …)` entries.
 * Pages call `loadSectionData(types, { locale })` with the types they show.
 */
export const loadSectionData = createSectionDataLoader([
  // Collection sections get every collection's cards (each cached on its own) and pick theirs.
  defineSectionLoader(collectionCardsSection, loadCollections),
  defineSectionLoader(collectionCarouselSection, loadCollections),
]);
