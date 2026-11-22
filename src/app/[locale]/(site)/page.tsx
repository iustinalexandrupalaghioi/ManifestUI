import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getSitePage, HOME_SLUG } from "@/components/site/internal/pages/content";
import { MissingPage, SitePageView } from "@/components/site/pages/SitePageView";
import { getSiteInfo } from "@/components/site/internal/siteInfo/content";

/** The home page: the "home" site page from the CMS (Content › Pages). */
export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const [page, info] = await Promise.all([getSitePage(locale, HOME_SLUG), getSiteInfo(locale)]);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description || undefined,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(routing.locales.map((code) => [code, `/${code}`])),
        // The bare domain negotiates the language from the browser.
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      siteName: info.siteName,
      title: page.title,
      description: page.description,
      url: `/${locale}`,
      locale: locale === "ro" ? "ro_RO" : "en_US",
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const [page, info] = await Promise.all([getSitePage(locale, HOME_SLUG), getSiteInfo(locale)]);
  if (!page) return <MissingPage slug={HOME_SLUG} withFooter />;

  // Structured data for search engines; change the type to fit the business (schema.org).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: info.siteName,
    description: page.description,
    url: `/${locale}`,
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SitePageView page={page} locale={locale} />
    </>
  );
}
