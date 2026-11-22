import { redirect } from "@/i18n/navigation";
import { SingletonRedirect } from "@/framework/content/ui/SingletonRedirect";
import { siteInfoDescriptor } from "@/components/cms/content/site-info/config/descriptor";

/** A single entry: open its row in the CMS's language (no list). */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <SingletonRedirect
      type="siteInfo"
      locale={locale}
      detailRoute={siteInfoDescriptor.routes.detail}
      redirectTo={(href) => redirect({ href, locale })}
    />
  );
}
