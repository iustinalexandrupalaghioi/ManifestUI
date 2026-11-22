import { SiteInfoDetailPage } from "@/components/cms/content/site-info/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="site-info" action="read">
      <SiteInfoDetailPage />
    </ResourceGuard>
  );
}
