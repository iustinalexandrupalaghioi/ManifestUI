import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { listSlugs } from "@/framework/content/server/content.server";
import { getService } from "@/components/site/internal/services/content";
import { getSiteInfo } from "@/components/site/internal/siteInfo/content";
import { Markdown } from "@/components/site/learn/Markdown";
import { EditPageButton } from "@/components/site/pages/EditPageButton";
import { SiteFooterSlot } from "@/components/site/SiteFooterSlot";

/**
 * A service from the CMS (Content › Services) at /<locale>/services/<slug>:
 * an entry on its own page, read through the content layer.
 */
// Static: every published service is built ahead, in every locale (untranslated ones show the English
// version); services published later are built on their first visit and refreshed when published again.
export async function generateStaticParams() {
  return [...new Set((await listSlugs("service")).map((service) => service.slug))].map((slug) => ({ slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps<"/[locale]/services/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const [service, info] = await Promise.all([getService(locale, slug), getSiteInfo(locale)]);
  if (!service) return {};
  return {
    title: `${service.title} · ${info.siteName}`,
    description: service.summary || undefined,
    alternates: {
      canonical: `/${locale}/services/${slug}`,
      languages: { en: `/en/services/${slug}`, ro: `/ro/services/${slug}` },
    },
  };
}

export default async function ServicePage({ params }: PageProps<"/[locale]/services/[slug]">) {
  const { locale, slug } = await params;
  const service = await getService(locale, slug);
  if (!service) notFound();
  const t = await getTranslations("Landing.pages");

  return (
    <>
      <main className="mx-auto w-full max-w-180 px-4 py-12 sm:px-6 lg:py-16">
        <Link href="/#services" className="mb-8 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground no-underline hover:text-foreground">
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t("allServices")}
        </Link>
        {service.locale !== locale && (
          <p className="mb-6 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">{t("fallbackNotice")}</p>
        )}
        <h1 className="m-0 font-display text-[clamp(32px,4.4vw,48px)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance">{service.title}</h1>
        {service.summary && <p className="mt-4 mb-0 text-lg leading-relaxed text-muted-foreground">{service.summary}</p>}
        {service.image.src && (
          <Image
            src={service.image.src}
            alt=""
            width={service.image.width || 1200}
            height={service.image.height || 675}
            sizes="(min-width: 768px) 720px, 100vw"
            className="mt-8 h-auto w-full rounded-2xl border"
            priority
          />
        )}
        <article className="mt-8 min-w-0">
          <Markdown source={service.body} />
        </article>
      </main>
      <EditPageButton kind="service" id={service.id} />
      <SiteFooterSlot />
    </>
  );
}
