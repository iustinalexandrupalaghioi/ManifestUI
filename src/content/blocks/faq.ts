import { z } from "zod";
import { defineBlock, list, text } from "@/framework/content";

/** Questions and answers, as collapsible rows next to the section title. */
export const faqBlock = defineBlock({
  type: "faq",
  label: { en: "FAQ", ro: "Întrebări frecvente" },
  fields: z.object({
    eyebrow: text({ label: { en: "Label above the title", ro: "Etichetă deasupra titlului" } }),
    title: text({ label: { en: "Title", ro: "Titlu" } }),
    items: list(
      z.object({
        q: text({ label: { en: "Question", ro: "Întrebare" } }),
        a: text({ label: { en: "Answer", ro: "Răspuns" }, multiline: true }),
      }),
      { label: { en: "Questions", ro: "Întrebări" }, itemLabel: { en: "Question", ro: "Întrebare" } },
    ),
  }),
  defaults: {
    en: { eyebrow: "FAQ", title: "Questions", items: [{ q: "", a: "" }] },
    ro: { eyebrow: "Întrebări frecvente", title: "Întrebări", items: [{ q: "", a: "" }] },
  },
});
