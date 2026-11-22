/** Field definitions several blocks share. */
import { group, L, link, text } from "@/framework/content";

export { L };

export const eyebrowField = () => text({ label: L("Label above the title", "Etichetă deasupra titlului") });
export const titleField = () => text({ label: L("Title", "Titlu") });
export const bodyField = (label = L("Text", "Text")) => text({ label, multiline: true });

/** A link: its text and where it goes: an entry (follows its address) or a URL ("/learn", "/#pricing", https://…). */
export const linkField = (label = L("Link", "Legătură")) =>
  group(
    {
      label: text({ label: L("Text", "Text"), required: true }),
      href: link({ label: L("Address", "Adresă"), required: true }),
    },
    { label },
  );
