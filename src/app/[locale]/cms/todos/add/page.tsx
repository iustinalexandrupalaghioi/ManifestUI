import { TodoAddPage } from "@/components/cms/main/todo/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="todos" action="add">
      <TodoAddPage />
    </ResourceGuard>
  );
}
