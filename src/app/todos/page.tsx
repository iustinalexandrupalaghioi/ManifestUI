import { TodoOverview } from "@/components/features/main/todos/resource";
import { ResourceGuard } from "@/framework/authorization/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="todos" action="read">
      <TodoOverview />
    </ResourceGuard>
  );
}
