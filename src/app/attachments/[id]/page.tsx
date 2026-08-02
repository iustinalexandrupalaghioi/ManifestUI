import { AttachmentDetailPage } from "@/components/features/main/todo-attachments/resource";
import { ResourceGuard } from "@/framework/authorization/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="attachments" action="read">
      <AttachmentDetailPage />
    </ResourceGuard>
  );
}
