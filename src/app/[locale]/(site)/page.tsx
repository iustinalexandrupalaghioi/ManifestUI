import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getSitePage, HOME_SLUG } from "@/components/site/internal/pages/content";
import { MissingPage, SitePageView } from "@/components/site/pages/SitePageView";

/** The home page: the "home" site page from the CMS (Website › Site pages). */
export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const page = await getSitePage(locale, HOME_SLUG);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description || undefined,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((code) => [code, `/${code}`])),
    },
    openGraph: { type: "website", title: page.title, description: page.description, url: `/${locale}` },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const page = await getSitePage(locale, HOME_SLUG);
  if (!page) return <MissingPage slug={HOME_SLUG} withFooter />;
  return <SitePageView page={page} locale={locale} />;
}
