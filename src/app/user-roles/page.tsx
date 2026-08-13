import { UserRoleOverview } from "@/components/features/administration/user-roles/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="user-roles" action="read">
      <UserRoleOverview />
    </ResourceGuard>
  );
}
