import { ServiceOverview } from "@/components/features/content/service/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="services" action="read">
      <ServiceOverview />
    </ResourceGuard>
  );
}
