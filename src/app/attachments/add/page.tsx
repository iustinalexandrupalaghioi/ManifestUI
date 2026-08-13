import { AttachmentAddPage } from "@/components/features/main/todo-attachments/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="attachments" action="add">
      <AttachmentAddPage />
    </ResourceGuard>
  );
}
