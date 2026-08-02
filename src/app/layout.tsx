import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { getMyPermissions } from "@/framework/authorization/getMyPermissions";
import { getCurrentUserId } from "@/framework/authorization/rbac";
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
  const [initialPermissions, userId] = await Promise.all([
    getMyPermissions(),
    getCurrentUserId(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex h-screen w-screen flex-col">
        <Providers
          initialPermissions={initialPermissions}
          isAuthenticated={!!userId}
          userId={userId}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
