import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SectionsPreview } from "@/components/site/internal/sections/SectionsPreview";
import { loadSectionData } from "@/components/extensions/sections/data";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Live preview for the CMS section editor (Website > Site pages). The editor
 * loads this page in a frame and posts the draft sections to it; nothing is
 * read from or written to the database here.
 */
export default async function SitePreviewPage({ params }: PageProps<"/[locale]/site-preview">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SectionsPreview data={await loadSectionData.all({ locale })} />;
}
