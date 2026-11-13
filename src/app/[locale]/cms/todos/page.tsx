import { TodoOverview } from "@/components/features/main/todo/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="todos" action="read">
      <TodoOverview />
    </ResourceGuard>
  );
}
