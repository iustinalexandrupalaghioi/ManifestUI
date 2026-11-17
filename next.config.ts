import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Site images uploaded in the CMS live in the public `site-media` bucket of
// this Supabase project; next/image may optimise them.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  experimental: {
    // `next/root-params`: next-intl reads the [locale] segment itself (src/i18n/request.ts),
    // so layouts and pages don't call setRequestLocale.
    rootParams: true,
  },
  images: {
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/site-media/**`)] : [],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
