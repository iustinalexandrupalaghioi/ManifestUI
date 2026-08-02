import { UserDetailPage } from "@/components/features/administration/users/resource";
import { ResourceGuard } from "@/framework/authorization/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="users" action="read">
      <UserDetailPage />
    </ResourceGuard>
  );
}
