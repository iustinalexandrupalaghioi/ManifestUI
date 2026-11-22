import { z } from "zod";
import { defineContentType, L, media, richText, text } from "@/framework/content";
import { service } from "@/db/schema";
import { servicesDescriptor } from "@/components/cms/content/service/config/descriptor";

/**
 * Services (Content › Services): a localized collection with a page each at
 * /<locale>/services/<slug>, listed on pages by the services block. Saves are
 * validated with the resource's schema (service/config/schema.ts); these
 * fields read stored rows leniently.
 */
export const serviceType = defineContentType({
  name: "service",
  descriptor: servicesDescriptor,
  table: service,
  fields: z.object({
    slug: text({ label: L("Address", "Adresă"), required: true }),
    title: text({ label: L("Title", "Titlu"), required: true }),
    summary: text({ label: L("Summary (shown on cards)", "Rezumat (afișat pe carduri)"), multiline: true }),
    image: media({ label: L("Image", "Imagine"), accept: "image" }),
    position: z.number().int().catch(0),
    body: richText({ label: L("Description", "Descriere") }),
  }),
});
