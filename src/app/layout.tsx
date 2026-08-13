import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "./providers";
import { AppNavBar } from "@/components/AppNavbar";
import { getMyPermissions } from "@/framework/authorization/actions/getMyPermissions";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import "./globals.css";

export const metadata: Metadata = {
  title: "ManifestUI Admin",
  description: "Full-stack admin panel",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [initialPermissions, userId, locale, messages] = await Promise.all([
    getMyPermissions(),
    getCurrentUserId(),
    getLocale(),
    getMessages(),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="flex h-screen w-screen flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers
            initialPermissions={initialPermissions}
            userId={userId}
            appNavBar={<AppNavBar isAuthenticated={!!userId} />}
          >
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
