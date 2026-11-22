/**
 * The website's block renderers, by block type: plain React components that
 * receive a block's content (src/content/blocks defines the blocks). Pages
 * render them with RenderBlocks; a type without a component isn't shown.
 */
import type { BlockComponents } from "@/framework/content/ui/RenderBlocks";
import { CallToAction } from "./CallToAction";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { Hero } from "./Hero";
import { Services } from "./Services";

export const blockComponents = {
  hero: Hero,
  features: Features,
  services: Services,
  faq: Faq,
  callToAction: CallToAction,
} satisfies BlockComponents;
