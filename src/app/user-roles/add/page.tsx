import { UserRoleAddPage } from "@/components/features/administration/user-roles/resource";
import { ResourceGuard } from "@/framework/authorization/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="user-roles" action="add">
      <UserRoleAddPage />
    </ResourceGuard>
  );
}
