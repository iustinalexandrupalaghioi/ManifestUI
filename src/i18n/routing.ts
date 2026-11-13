import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ro"],
  defaultLocale: "ro",
  localePrefix: "always",
});
