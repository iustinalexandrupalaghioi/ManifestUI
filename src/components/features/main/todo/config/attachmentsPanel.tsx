"use client";

import { PaperclipIcon } from "lucide-react";
import { z } from "zod";
import { defineDetailComponent } from "@/framework/extensions";
import { RelationList } from "@/framework/components/relations/RelationList";
import type { Todo } from "@/app/types/main/Todo";
import { todosRelations } from "./relations";

const todoAttachments = todosRelations.find((relation) => relation.key === "attachments")!;

export const todoAttachmentsPanel = defineDetailComponent({
  type: "todoAttachments",
  label: { en: "Todo attachments", ro: "Atașamente sarcină" },
  icon: PaperclipIcon,
  props: z.object({ height: z.number().int().min(120).default(300) }),
  component: ({ item, props }: { item: Todo; props: { height: number } }) => (
    <div className="w-full lg:shrink-0">
      <RelationList
        relation={todoAttachments}
        item={item}
        slotId={`attachments-preview-${item.id}`}
        height={props.height}
      />
    </div>
  ),
});
