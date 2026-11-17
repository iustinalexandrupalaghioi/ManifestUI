import { registerSections } from "@/framework/site";
import { collectionCardsSection } from "./CollectionCardsSection";
import { collectionCarouselSection } from "./CollectionCarouselSection";

/**
 * Section types for CMS-managed site pages, in "Add section" order. Sections
 * that need server data have their loader in ./data.ts. Add one with
 * `pnpm manifest section <name>` (guide: README › Building the website).
 */
export const sections = registerSections([
  // Generic sections that show a CMS collection (src/components/extensions/collections), e.g. the services.
  collectionCardsSection,
  collectionCarouselSection,
]);
