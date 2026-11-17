import { UserDetailPage } from "@/components/cms/administration/user/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="users" action="read">
      <UserDetailPage />
    </ResourceGuard>
  );
}
