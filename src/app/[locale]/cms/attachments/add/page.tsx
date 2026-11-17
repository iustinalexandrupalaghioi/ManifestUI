import { AttachmentAddPage } from "@/components/cms/main/todo-attachment/resource";
import { ResourceGuard } from "@/framework/authorization/ui/ResourceGuard";

export default function Page() {
  return (
    <ResourceGuard resourceId="attachments" action="add">
      <AttachmentAddPage />
    </ResourceGuard>
  );
}
