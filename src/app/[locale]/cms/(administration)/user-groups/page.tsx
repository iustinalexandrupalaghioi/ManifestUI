import { UserGroupOverview } from "@/components/cms/administration/user-group/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="user-groups" action="read">
      <UserGroupOverview />
    </ResourceGuard>
  );
}
