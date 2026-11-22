import { z } from "zod";
import { defineBlock, group, L, list, media, text } from "@/framework/content";
import { linkField, titleField } from "./fields";

/** The sticky site header: the site's name or logo, links and the call to action (interface labels stay in the message files). */
export const headerBlock = defineBlock({
  type: "siteHeader",
  label: L("Header", "Antet"),
  fields: z.object({
    brand: text({ label: L("Site name", "Numele site-ului"), required: true }),
    logo: media({ label: L("Logo (optional; replaces the name)", "Siglă (opțional; înlocuiește numele)"), accept: "image" }),
    links: list(linkField(), { label: L("Links", "Legături"), itemLabel: L("Link", "Legătură") }),
    cta: linkField(L("Call to action", "Îndemn")),
    ctaShort: text({ label: L("Call to action, short (phones)", "Îndemn, scurt (telefoane)") }),
  }),
});

/** The site-wide footer: name, tagline, link columns and the copyright line. */
export const footerBlock = defineBlock({
  type: "siteFooter",
  label: L("Footer", "Subsol"),
  fields: z.object({
    brand: text({ label: L("Site name", "Numele site-ului") }),
    tagline: text({ label: L("Tagline", "Descriere scurtă"), multiline: true }),
    columns: list(
      z.object({
        title: titleField(),
        links: list(linkField(), { label: L("Links", "Legături"), itemLabel: L("Link", "Legătură") }),
      }),
      { label: L("Columns", "Coloane"), itemLabel: L("Column", "Coloană") },
    ),
    /** {year} becomes the current year. */
    copyright: text({ label: L("Copyright ({year} = current year)", "Drepturi de autor ({year} = anul curent)") }),
  }),
});

/** The navigation single entry's fields: `{ header, footer }`, stored in `site_settings.content`. */
export const navigationFields = z.object({
  header: group(headerBlock.fields.shape, { label: headerBlock.label }),
  footer: group(footerBlock.fields.shape, { label: footerBlock.label }),
});
