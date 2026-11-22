import { z } from "zod";
import { defineBlock, L, list, text } from "@/framework/content";
import { bodyField, eyebrowField, titleField } from "./fields";

/** A heading and a grid of short points (a title and a sentence each). */
export const featuresBlock = defineBlock({
  type: "features",
  label: L("Features", "Avantaje"),
  description: L("A grid of short points", "O grilă de puncte scurte"),
  fields: z.object({
    eyebrow: eyebrowField(),
    title: titleField(),
    intro: text({ label: L("Intro", "Introducere"), multiline: true }),
    items: list(z.object({ title: titleField(), body: bodyField() }), {
      label: L("Points", "Puncte"),
      itemLabel: L("Point", "Punct"),
    }),
  }),
  defaults: {
    en: {
      title: "Why work with us",
      items: [
        { title: "First point", body: "A sentence that explains it." },
        { title: "Second point", body: "A sentence that explains it." },
        { title: "Third point", body: "A sentence that explains it." },
      ],
    },
    ro: {
      title: "De ce să lucrezi cu noi",
      items: [
        { title: "Primul punct", body: "O propoziție care îl explică." },
        { title: "Al doilea punct", body: "O propoziție care îl explică." },
        { title: "Al treilea punct", body: "O propoziție care îl explică." },
      ],
    },
  },
});
