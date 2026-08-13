import { RoleAddPage } from "@/components/features/administration/roles/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="roles" action="add">
      <RoleAddPage />
    </ResourceGuard>
  );
}
