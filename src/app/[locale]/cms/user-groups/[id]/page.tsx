import { UserGroupDetailPage } from "@/components/features/administration/user-groups/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="user-groups" action="read">
      <UserGroupDetailPage />
    </ResourceGuard>
  );
}
