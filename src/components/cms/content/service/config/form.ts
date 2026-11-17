import type { FormConfig } from "@/framework/components/form/types/types";
import { PageLocale } from "../../site-page/config/constants";
import type { ServiceFormValues } from "./schema";

export const servicesForm: FormConfig<ServiceFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 4,
        fields: [
          {
            type: "input",
            name: "title",
            label: { en: "Title", ro: "Titlu" },
            span: 2,
          },
          {
            type: "pageAddress",
            name: "slug",
            label: { en: "Address", ro: "Adresă" },
            props: {
              placeholder: "web-design",
              prefix: "/en | /ro /services/",
            },
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
            name: "summary",
            label: {
              en: "Summary (shown on cards)",
              ro: "Rezumat (afișat pe carduri)",
            },
            maxRows: 3,
            span: 2,
          },
          {
            type: "input",
            name: "position",
            label: { en: "Order", ro: "Ordine" },
            inputType: "number",
            span: 1,
          },
          {
            type: "switch",
            name: "published",
            label: { en: "Published", ro: "Publicat" },
            span: 1,
          },
          {
            type: "siteImage",
            name: "image",
            label: { en: "Image", ro: "Imagine" },
            props: { resource: "services" },
            span: 4,
          },
        ],
      },
      {
        cols: 1,
        fields: [
          {
            type: "markdown",
            name: "body",
            label: { en: "Description", ro: "Descriere" },
            props: { height: 360 },
            span: 1,
          },
        ],
      },
    ],
  },
  className: "w-full max-w-none",
};
