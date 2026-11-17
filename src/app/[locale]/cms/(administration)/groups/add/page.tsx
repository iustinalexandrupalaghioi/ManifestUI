import { GroupAddPage } from "@/components/cms/administration/group/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="groups" action="add">
      <GroupAddPage />
    </ResourceGuard>
  );
}
