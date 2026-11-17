import { useTranslations } from "next-intl";
import { z } from "zod";
import { AddItem, defineSection, EditOnly, list, List, RemoveItem, Text, text } from "@/framework/site";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { SiteLink } from "@/components/site/SiteLink";
import { L, titleField } from "@/components/extensions/sections/fields";
import { linkField } from "@/components/extensions/site/fields";
import { withNote } from "@/components/extensions/site/SiteHeader";

const linkClass =
  "inline-flex min-h-11 items-center rounded-sm text-[15px] text-muted-foreground no-underline hover:text-foreground sm:min-h-0 sm:py-1";
const heading = "m-0 text-[13px] font-semibold tracking-[0.06em] text-foreground uppercase";

/**
 * The site-wide footer, edited in Website › Site settings: the site's name
 * and tagline, link columns and the copyright line, then the language and
 * theme controls (interface labels stay in the message files).
 */
export const siteFooter = defineSection({
  type: "siteFooter",
  label: L("Footer", "Subsol"),
  schema: z.object({
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
  component: function SiteFooterView({ content: c, edit }) {
    const t = useTranslations("Landing.footer");
    const tNav = useTranslations("Landing.nav");
    const tSite = useTranslations("Site");
    return (
      <footer className="border-t bg-surface">
        <div className="mx-auto grid w-full max-w-300 gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
          <div className="flex max-w-[320px] flex-col gap-3">
            <Text path="brand" as="p" optional className="m-0 font-display text-lg font-semibold tracking-tight" />
            <Text path="tagline" as="p" optional multiline className="m-0 text-sm leading-relaxed text-muted-foreground" />
          </div>
          <List path="columns" items={c.columns}>
            {(column, i) => (
              <nav aria-labelledby={`footer-column-${i}`} className="flex flex-col gap-1 sm:gap-2">
                <h2 id={`footer-column-${i}`} className={edit ? `${heading} flex items-center gap-2` : heading}>
                  <Text path="title" />
                  <RemoveItem label={L("Remove column", "Elimină coloana")} />
                </h2>
                <List path="links" items={column.links}>
                  {(link) =>
                    withNote(
                      edit,
                      <SiteLink href={link.href} className={linkClass}>
                        <Text path="label" />
                      </SiteLink>,
                      "href",
                      <RemoveItem label={L("Remove link", "Elimină legătura")} />,
                    )
                  }
                </List>
                <AddItem path="links" label={L("Add link", "Adaugă o legătură")} className="self-start" />
              </nav>
            )}
          </List>
          <EditOnly>
            <AddItem path="columns" label={L("Add column", "Adaugă o coloană")} className="self-start" />
          </EditOnly>
          <div className="flex flex-col gap-3">
            <span aria-hidden className={heading}>
              {t("preferences")}
            </span>
            <LanguageToggle label={tNav("language")} size="lg" className="self-start" />
            <ThemeToggle
              label={tSite("theme")}
              names={{ light: tNav("themeLight"), dark: tNav("themeDark"), system: tNav("themeSystem") }}
              className="self-start"
            />
          </div>
        </div>
        <div className="mx-auto w-full max-w-300 border-t px-4 py-6 text-[13px] text-muted-foreground sm:px-6">
          <Text path="copyright" vars={{ year: String(new Date().getFullYear()) }} />
        </div>
      </footer>
    );
  },
});
