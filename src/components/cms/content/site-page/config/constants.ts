import { createEnum } from "@/framework/lib/utils";

/** Values stored in `site_page.locale` (the site's locales), with their labels. */
export const PageLocale = createEnum({
  en: { en: "English", ro: "Engleză" },
  ro: { en: "Romanian", ro: "Română" },
});

export type PageLocale = keyof typeof PageLocale.labels;

/** Values stored in `site_page.kind`: a Markdown page or a page built from sections. */
export const PageKind = createEnum({
  text: { en: "Text page", ro: "Pagină de text" },
  sections: { en: "Sections page", ro: "Pagină din secțiuni" },
});

export type PageKind = keyof typeof PageKind.labels;
