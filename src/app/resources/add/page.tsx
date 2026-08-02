import { ResourceAddPage } from "@/components/features/administration/resources/resource";
import { ResourceGuard } from "@/framework/authorization/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="resources" action="add">
      <ResourceAddPage />
    </ResourceGuard>
  );
}
