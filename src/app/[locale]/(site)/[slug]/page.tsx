import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getSitePage, HOME_SLUG } from "@/components/site/internal/pages/content";
import { SitePageView } from "@/components/site/pages/SitePageView";
import { listSlugs } from "@/framework/content/server/content.server";
import { getSiteInfo } from "@/components/site/internal/siteInfo/content";

/**
 * Pages managed in the CMS (Website > Site pages), served at /<locale>/<slug>.
 * Static routes such as /services take precedence over this one; the "home"
 * page lives at /<locale>.
 */
// Static: every published page is built ahead (its address in this locale); pages published later are
// built on their first visit (dynamicParams) and refreshed when they are published again.
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return (await listSlugs("page")).filter((page) => page.locale === params.locale && page.slug !== HOME_SLUG).map(({ slug }) => ({ slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const [page, info] = await Promise.all([slug === HOME_SLUG ? null : getSitePage(locale, slug), getSiteInfo(locale)]);
  if (!page) return {};
  return {
    title: `${page.title} · ${info.siteName}`,
    description: page.description || undefined,
    alternates: {
      canonical: `/${locale}/${slug}`,
      languages: { en: `/en/${slug}`, ro: `/ro/${slug}` },
    },
  };
}

export default async function SitePage({ params }: PageProps<"/[locale]/[slug]">) {
  const { locale, slug } = await params;
  if (slug === HOME_SLUG) redirect({ href: "/", locale });
  const page = await getSitePage(locale, slug);
  if (!page) notFound();
  return <SitePageView page={page} locale={locale} />;
}
