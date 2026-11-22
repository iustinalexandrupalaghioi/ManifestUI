import { z } from "zod";
import { defineBlock, L, text } from "@/framework/content";
import { linkField } from "./fields";

/** A closing band: a title, a sentence and one button. */
export const callToActionBlock = defineBlock({
  type: "callToAction",
  label: L("Call to action", "Îndemn"),
  description: L("A closing band with one button", "O bandă de final cu un buton"),
  fields: z.object({
    title: text({ label: L("Title", "Titlu"), required: true }),
    text: text({ label: L("Text", "Text"), multiline: true }),
    button: linkField(L("Button", "Buton")),
  }),
  defaults: {
    en: { title: "Ready to talk?", text: "Tell us what you need; we answer within a day.", button: { label: "Contact us", href: { kind: "url", href: "mailto:hello@example.com" } } },
    ro: { title: "Vrei să vorbim?", text: "Spune-ne de ce ai nevoie; răspundem în cel mult o zi.", button: { label: "Contactează-ne", href: { kind: "url", href: "mailto:hello@example.com" } } },
  },
});
