import { RelationOverview } from "@/components/features/main/relation/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="relations" action="read">
      <RelationOverview />
    </ResourceGuard>
  );
}
