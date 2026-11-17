import { getTranslations } from "next-intl/server";
import { Markdown } from "@/components/site/learn/Markdown";
import { MotionProvider } from "@/components/site/landing/motion";
import { RenderSections } from "@/framework/site";
import { loadSectionData } from "@/extensions/sections/data";
import { SiteFooterSlot } from "@/components/site/SiteFooterSlot";
import type { SitePageContent } from "../internal/pages/content";
import { EditPageButton } from "./EditPageButton";

/**
 * Renders a CMS site page: sections for a sections page, Markdown for a text
 * page. `withFooter={false}` where the route's layout already adds one.
 */
export async function SitePageView({
  page,
  locale,
  withFooter = true,
}: {
  page: SitePageContent;
  locale: string;
  withFooter?: boolean;
}) {
  if (page.kind === "sections") {
    const visible = page.sections.filter((section) => !section.hidden).map((section) => section.type);
    const data = await loadSectionData(visible, { locale });
    return (
      <MotionProvider>
        <main>
          <RenderSections sections={page.sections} data={data} />
        </main>
        {withFooter && <SiteFooterSlot />}
        <EditPageButton kind="page" id={page.id} />
      </MotionProvider>
    );
  }

  const t = await getTranslations("Landing.pages");
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(page.updatedAt));
  return (
    <>
      <main className="mx-auto w-full max-w-180 px-4 py-12 sm:px-6 lg:py-16">
        <article className="min-w-0">
          <h1 className="m-0 mb-3 font-display text-[clamp(30px,4vw,44px)] leading-tight font-semibold tracking-tight">
            {page.title}
          </h1>
          <p className="m-0 mb-8 text-sm text-muted-foreground">{t("updated", { date: updated })}</p>
          <Markdown source={page.body} />
        </article>
      </main>
      {withFooter && <SiteFooterSlot />}
      <EditPageButton kind="page" id={page.id} />
    </>
  );
}

/** Shown when a required page (home, learn) hasn't been created in the CMS yet. */
export async function MissingPage({ slug, withFooter = false }: { slug: string; withFooter?: boolean }) {
  const t = await getTranslations("Landing.pages");
  return (
    <>
      <main className="mx-auto flex min-h-[50vh] w-full max-w-180 flex-col justify-center gap-3 px-4 py-16 sm:px-6">
        <h1 className="m-0 font-display text-3xl font-semibold">{t("missingTitle")}</h1>
        <p className="m-0 text-base text-muted-foreground">{t("missingBody", { slug })}</p>
      </main>
      {withFooter && <SiteFooterSlot />}
    </>
  );
}
