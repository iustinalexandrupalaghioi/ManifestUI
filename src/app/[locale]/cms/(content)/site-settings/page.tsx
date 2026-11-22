import { redirect } from "@/i18n/navigation";
import { SingletonRedirect } from "@/framework/content/ui/SingletonRedirect";
import { siteSettingsDescriptor } from "@/components/cms/content/site-settings/config/descriptor";

/** A single entry: open its row in the CMS's language (no list). */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <SingletonRedirect
      type="navigation"
      locale={locale}
      detailRoute={siteSettingsDescriptor.routes.detail}
      redirectTo={(href) => redirect({ href, locale })}
    />
  );
}
