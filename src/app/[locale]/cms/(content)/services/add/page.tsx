import { ServiceAddPage } from "@/components/features/content/service/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="services" action="add">
      <ServiceAddPage />
    </ResourceGuard>
  );
}
