import { group, text } from "@/framework/site";
import { L } from "../sections/fields";

/** A link: its text and where it goes ("/learn", "/#pricing" or a full URL). Becomes `link()` in Phase 2. */
export const linkField = (label = L("Link", "Legătură")) =>
  group(
    {
      label: text({ label: L("Text", "Text"), required: true }),
      href: text({ label: L("Address", "Adresă"), required: true }),
    },
    { label },
  );
