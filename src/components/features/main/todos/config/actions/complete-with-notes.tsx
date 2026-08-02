import type { ActionFormConfig } from "@/framework/types/resource-hook-types";
import type { Todo } from "@/app/types/main/Todo";
import { BookmarkCheck } from "lucide-react";
import { useCompleteTodos } from "../../hooks/useCompleteTodo";
import {
  completeWithNotesSchema,
  type CompleteWithNoteValues,
} from "../schema";

export const completeWithNotes: ActionFormConfig<Todo, CompleteWithNoteValues> =
  {
    key: "complete-with-note",
    title: "Complete with notes",
    isEligible: (todo) => !todo.completed,
    label: (
      <>
        <BookmarkCheck /> Complete with note
      </>
    ),

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
                label: "Completion notes",
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
