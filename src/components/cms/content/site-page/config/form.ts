import type { FormConfig } from "@/framework/components/form/types/types";
import { PageKind, PageLocale } from "./constants";
import type { SitePageFormValues } from "./schema";

export const sitePagesForm: FormConfig<SitePageFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 4,
        fields: [
          { type: "input", name: "title", label: { en: "Title", ro: "Titlu" }, span: 2 },
          {
            type: "pageAddress",
            name: "slug",
            label: { en: "Page address", ro: "Adresa paginii" },
            props: { placeholder: "privacy-policy" },
            span: 1,
          },
          {
            type: "select",
            name: "locale",
            label: { en: "Language", ro: "Limbă" },
            options: PageLocale.options,
            span: 1,
          },
          {
            type: "textarea",
            name: "description",
            label: { en: "Search engine description", ro: "Descriere pentru motoarele de căutare" },
            maxRows: 3,
            span: 2,
          },
          {
            type: "select",
            name: "kind",
            label: { en: "Page type", ro: "Tipul paginii" },
            options: PageKind.options,
            span: 1,
          },
          { type: "switch", name: "published", label: { en: "Published", ro: "Publicată" }, span: 1 },
        ],
      },
      {
        cols: 1,
        fields: [
          {
            type: "markdown",
            name: "body",
            label: { en: "Content", ro: "Conținut" },
            props: { height: 560 },
            span: 1,
            hidden: (values) => values?.kind === "sections",
          },
        ],
      },
      {
        type: "sectionsEditor",
        props: {},
        hidden: (values) => values?.kind !== "sections",
      },
    ],
  },
  className: "w-full max-w-none",
};
