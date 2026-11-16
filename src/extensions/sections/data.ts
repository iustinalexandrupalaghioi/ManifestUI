import "server-only";

import { createSectionDataLoader } from "@/modules/site/server";

/**
 * Server data for the sections that need more than their content (database
 * records…): add `defineSectionLoader(section, ({ locale }) => …)` entries.
 * Pages call `loadSectionData(types, { locale })` with the types they show.
 */
export const loadSectionData = createSectionDataLoader([]);
