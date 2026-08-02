import { ResourceOverview } from "@/components/features/administration/resources/resource";
import { ResourceGuard } from "@/framework/authorization/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="resources" action="read">
      <ResourceOverview />
    </ResourceGuard>
  );
}
