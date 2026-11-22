import { ContentDraftDetailPage } from "@/components/cms/content/content-draft/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="content-drafts" action="read">
      <ContentDraftDetailPage />
    </ResourceGuard>
  );
}
