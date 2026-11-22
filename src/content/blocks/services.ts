import { z } from "zod";
import { choice, defineBlock, L, reference, text } from "@/framework/content";
import { eyebrowField, titleField } from "./fields";

/**
 * Services as cards or a carousel, each linking to its page: the chosen ones (a
 * reference, so editing a service updates every page that shows it) or, when
 * none are chosen, every published service in order (the block's loader in
 * src/components/site/blocks/data.ts).
 */
export const servicesBlock = defineBlock({
  type: "services",
  label: L("Services", "Servicii"),
  description: L("Services as cards or a carousel", "Servicii drept carduri sau carusel"),
  fields: z.object({
    eyebrow: eyebrowField(),
    title: titleField(),
    intro: text({ label: L("Intro", "Introducere"), multiline: true }),
    layout: choice(
      [
        { value: "cards", label: L("Cards", "Carduri") },
        { value: "carousel", label: L("Carousel", "Carusel") },
      ],
      { label: L("Layout", "Așezare"), default: "cards" },
    ),
    entries: reference("service", {
      many: true,
      max: 12,
      label: L("Services to show (none chosen: all, in order)", "Servicii de afișat (niciunul ales: toate, în ordine)"),
    }),
  }),
  defaults: { en: { title: "Services" }, ro: { title: "Servicii" } },
});
