import { RoleOverview } from "@/components/features/administration/roles/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="roles" action="read">
      <RoleOverview />
    </ResourceGuard>
  );
}
