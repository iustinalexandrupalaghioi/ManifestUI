import { SiteSettingsDetailPage } from "@/components/cms/content/site-settings/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="site-settings" action="read">
      <SiteSettingsDetailPage />
    </ResourceGuard>
  );
}
