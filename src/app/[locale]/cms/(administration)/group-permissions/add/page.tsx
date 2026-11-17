import { GroupPermissionAddPage } from "@/components/cms/administration/group-permission/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="group-permissions" action="add">
      <GroupPermissionAddPage />
    </ResourceGuard>
  );
}
