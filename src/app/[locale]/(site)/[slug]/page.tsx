import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSitePage, HOME_SLUG } from "@/components/site/internal/pages/content";
import { SitePageView } from "@/components/site/pages/SitePageView";

/**
 * Pages managed in the CMS (Website > Site pages), served at /<locale>/<slug>.
 * Static routes such as /learn take precedence over this one; the "home"
 * page lives at /<locale>.
 */
// Static: each page is rendered on its first visit and kept until it's saved in the CMS (see components/site/internal/cache.ts).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = slug === HOME_SLUG ? null : await getSitePage(locale, slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description || undefined,
    alternates: {
      canonical: `/${locale}/${slug}`,
      languages: { en: `/en/${slug}`, ro: `/ro/${slug}` },
    },
  };
}

export default async function SitePage({ params }: PageProps<"/[locale]/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (slug === HOME_SLUG) redirect({ href: "/", locale });
  const page = await getSitePage(locale, slug);
  if (!page) notFound();
  return <SitePageView page={page} locale={locale} />;
}
