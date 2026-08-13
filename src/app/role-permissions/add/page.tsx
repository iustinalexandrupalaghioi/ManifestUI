import { RolePermissionAddPage } from "@/components/features/administration/role-permissions/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="role-permissions" action="add">
      <RolePermissionAddPage />
    </ResourceGuard>
  );
}
