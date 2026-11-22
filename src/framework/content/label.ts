import type { TranslatableText } from "@/framework/types/i18n-types";

/** A label in both languages: `L("Title", "Titlu")`. */
export const L = (en: string, ro: string): TranslatableText => ({ en, ro });
