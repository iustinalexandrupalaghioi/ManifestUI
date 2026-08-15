import { GroupPermissionOverview } from "@/components/features/administration/group-permissions/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="group-permissions" action="read">
      <GroupPermissionOverview />
    </ResourceGuard>
  );
}
