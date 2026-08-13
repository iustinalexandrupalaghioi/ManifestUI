import { RelationAddPage } from "@/components/features/main/relations/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="relations" action="add">
      <RelationAddPage />
    </ResourceGuard>
  );
}
