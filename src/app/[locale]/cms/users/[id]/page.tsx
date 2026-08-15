import { UserDetailPage } from "@/components/features/administration/user/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="users" action="read">
      <UserDetailPage />
    </ResourceGuard>
  );
}
