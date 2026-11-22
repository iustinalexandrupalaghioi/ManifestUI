import { AttachmentDetailPage } from "@/components/cms/main/todo-attachment/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="attachments" action="read">
      <AttachmentDetailPage />
    </ResourceGuard>
  );
}
