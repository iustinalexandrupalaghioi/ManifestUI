import "server-only";

import { createBlockDataLoader, defineBlockLoader } from "@/framework/content/server/blockData";
import { getServices } from "@/components/site/internal/services/content";
import { servicesBlock } from "@/content/blocks/services";

/**
 * Server data for the blocks that need more than their content. Pages call
 * `loadBlockData(types, { locale })` with the block types they show; the CMS
 * preview calls `loadBlockData.all(...)` (the editor can add any block).
 */
export const loadBlockData = createBlockDataLoader([
  // Every published service, for a services block with none chosen.
  defineBlockLoader(servicesBlock, ({ locale }) => getServices(locale)),
]);
