import { useTranslations } from "next-intl";
import type { ActionFormConfig } from "@/framework/types/resource-hook-types";
import type { Todo } from "@/app/types/main/Todo";
import { BookmarkCheck } from "lucide-react";
import { useCompleteTodos } from "../../hooks/useCompleteTodo";
import {
  completeWithNotesSchema,
  type CompleteWithNoteValues,
} from "../schema";

function CompleteWithNoteLabel() {
  const t = useTranslations("Todos");
  return (
    <>
      <BookmarkCheck /> {t("completeWithNote")}
    </>
  );
}

function CompleteWithNotesTitle() {
  const t = useTranslations("Todos");
  return t("completeWithNotesTitle");
}

export const completeWithNotes: ActionFormConfig<Todo, CompleteWithNoteValues> =
  {
    key: "complete-with-note",
    title: <CompleteWithNotesTitle />,
    isEligible: (todo) => !todo.completed,
    label: <CompleteWithNoteLabel />,

    form: {
      layout: {
        mode: "stack",
        sections: [
          {
            cols: 1,
            fields: [
              {
                type: "textarea",
                name: "notes",
                label: { en: "Completion notes", ro: "Note de finalizare" },
                placeholder: "Describe what was done...",
                maxRows: 5,
              },
            ],
          },
        ],
      },
    },
    successMessage: "completed!",
    actionSchema: completeWithNotesSchema,
    actionEmptyValues: { notes: "" },
    useSubmit: () => {
      const submit = useCompleteTodos<CompleteWithNoteValues>();
      return submit;
    },
  };
