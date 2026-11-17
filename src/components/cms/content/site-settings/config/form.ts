import type { FormConfig } from "@/framework/components/form/types/types";
import { PageLocale } from "../../site-page/config/constants";
import type { SiteSettingsFormValues } from "./schema";

export const siteSettingsForm: FormConfig<SiteSettingsFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 4,
        fields: [{ type: "select", name: "locale", label: { en: "Language", ro: "Limbă" }, options: PageLocale.options, span: 1 }],
      },
      // The header and footer, edited on the canvas like a page.
      { type: "sectionsEditor", props: { mode: "settings" } },
    ],
  },
  className: "w-full max-w-none",
};
