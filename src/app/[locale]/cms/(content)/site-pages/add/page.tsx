import { SitePageAddPage } from "@/components/features/content/site-page/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="site-pages" action="add">
      <SitePageAddPage />
    </ResourceGuard>
  );
}
