/**
 * Every block the project defines, in Add block picker order. Each block is a
 * React-free `defineBlock` in this folder; its renderer lives with the
 * frontend (the website's `blockComponents`, src/components/site/blocks).
 * Add one with `pnpm manifest block <name>`.
 */
import { callToActionBlock } from "./callToAction";
import { faqBlock } from "./faq";
import { featuresBlock } from "./features";
import { heroBlock } from "./hero";
import { servicesBlock } from "./services";

export const allBlocks = [heroBlock, featuresBlock, servicesBlock, faqBlock, callToActionBlock] as const;
