import { ContentRevisionOverview } from "@/components/cms/content/content-revision/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="content-revisions" action="read">
      <ContentRevisionOverview />
    </ResourceGuard>
  );
}
