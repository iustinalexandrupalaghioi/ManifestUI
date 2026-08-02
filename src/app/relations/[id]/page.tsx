import { RelationDetailPage } from "@/components/features/main/relations/resource";
import { ResourceGuard } from "@/framework/authorization/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="relations" action="read">
      <RelationDetailPage />
    </ResourceGuard>
  );
}
