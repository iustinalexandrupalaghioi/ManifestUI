import { z } from "zod";
import { defineContentType, L, text } from "@/framework/content";
import { siteInfo } from "@/db/schema";
import { siteInfoDescriptor } from "@/components/cms/content/site-info/config/descriptor";

/** The site's name and default description, used in titles, metadata and structured data. */
export const siteInfoType = defineContentType({
  name: "siteInfo",
  descriptor: siteInfoDescriptor,
  table: siteInfo,
  fields: z.object({
    siteName: text({ label: L("Site name", "Numele site-ului"), required: true }),
    description: text({ label: L("Default search engine description", "Descrierea implicită pentru motoarele de căutare"), multiline: true }),
  }),
  // Rows missing for a locale start from these (pnpm content:migrate creates them).
  defaults: {
    en: { siteName: "Your company", description: "What your company does, in one or two sentences." },
    ro: { siteName: "Compania ta", description: "Ce face compania ta, în una sau două propoziții." },
  },
});
