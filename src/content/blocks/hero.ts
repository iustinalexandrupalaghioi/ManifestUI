import { z } from "zod";
import { defineBlock, L, media, text } from "@/framework/content";
import { eyebrowField, linkField } from "./fields";

/** The opening band: title, a sentence, up to two buttons and an optional image beside them. */
export const heroBlock = defineBlock({
  type: "hero",
  label: L("Hero", "Introducere"),
  description: L("Title, text, buttons and an image", "Titlu, text, butoane și o imagine"),
  fields: z.object({
    eyebrow: eyebrowField(),
    title: text({ label: L("Title", "Titlu"), required: true }),
    text: text({ label: L("Text", "Text"), multiline: true }),
    primary: linkField(L("Main button", "Butonul principal")),
    secondary: linkField(L("Second button (optional)", "Al doilea buton (opțional)")),
    image: media({ label: L("Image (optional)", "Imagine (opțional)"), accept: "image" }),
    imageAlt: text({ label: L("Image description (for screen readers)", "Descrierea imaginii (pentru cititoare de ecran)") }),
  }),
  defaults: {
    en: {
      title: "A clear promise in one line.",
      text: "One or two sentences on what you offer and who it is for.",
      primary: { label: "Contact us", href: { kind: "url", href: "/#contact" } },
      secondary: { label: "Our services", href: { kind: "url", href: "/#services" } },
    },
    ro: {
      title: "O promisiune clară, într-un rând.",
      text: "Una sau două propoziții despre ce oferi și pentru cine.",
      primary: { label: "Contactează-ne", href: { kind: "url", href: "/#contact" } },
      secondary: { label: "Serviciile noastre", href: { kind: "url", href: "/#services" } },
    },
  },
});
