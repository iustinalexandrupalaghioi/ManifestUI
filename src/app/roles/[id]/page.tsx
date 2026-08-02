import { RoleDetailPage } from "@/components/features/administration/roles/resource";
import { ResourceGuard } from "@/framework/authorization/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="roles" action="read">
      <RoleDetailPage />
    </ResourceGuard>
  );
}
