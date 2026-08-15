import { TodoDetailPage } from "@/components/features/main/todos/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="todos" action="read">
      <TodoDetailPage />
    </ResourceGuard>
  );
}
