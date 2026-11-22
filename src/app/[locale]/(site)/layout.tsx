import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SiteHeaderSlot } from "@/components/site/SiteHeaderSlot";
import { getSiteInfo } from "@/components/site/internal/siteInfo/content";
import { SiteSessionProvider } from "@/components/site/internal/session/SiteSession";
import { localeParams, RootDocument, rootMetadata, checkLocale } from "../_root/RootDocument";
import "./globals.css";

// Same storage key and values as ThemeProvider; "system" (the default) follows the OS.
const THEME_SCRIPT = `try{var t=localStorage.getItem("vite-ui-theme")||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var c=document.documentElement.classList;c.remove("light","dark");c.add(t)}catch(e){}`;

export const generateStaticParams = localeParams;

/** The site name and default description come from the "siteInfo" single entry (its defaults until published). */
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const info = await getSiteInfo((await params).locale);
  return { ...rootMetadata, title: info.siteName, description: info.description || undefined };
}

export default async function SiteLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = checkLocale((await params).locale);

  // The content editor's messages are CMS-only: they don't ship with the site's pages.
  const { Content: _cmsOnly, ...siteMessages } = await getMessages();

  // Nothing here reads the request (cookies, the signed-in user), so public
  // pages can be static; the signed-in parts load in the browser.
  return (
    <RootDocument locale={locale}>
    <NextIntlClientProvider messages={siteMessages}>
    <ThemeProvider>
      {/* Applies the stored theme before first paint, so there's no flash of the other one. */}
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <Toaster />
      <SiteSessionProvider>
        <SiteHeaderSlot />
        {children}
      </SiteSessionProvider>
    </ThemeProvider>
    </NextIntlClientProvider>
    </RootDocument>
  );
}
