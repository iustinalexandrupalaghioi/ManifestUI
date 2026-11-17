/** Field definitions several site sections share. */
import { text } from "@/framework/site";
import type { TranslatableText } from "@/framework/types/i18n-types";

export const L = (en: string, ro: string): TranslatableText => ({ en, ro });

export const eyebrowField = () => text({ label: L("Label above the title", "Etichetă deasupra titlului") });
export const titleField = () => text({ label: L("Title", "Titlu") });
export const bodyField = (label = L("Text", "Text")) => text({ label, multiline: true });
