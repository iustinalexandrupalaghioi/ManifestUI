"use client"

import { Button } from "@/framework/components/ui/button"
import { DialogClose } from "@/framework/components/ui/dialog"
import { useState } from "react"
import { BaseDialog } from "../components/dialog/BaseDialog"

export function usePendingChanges(isDirty: boolean) {
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const guard = (action: () => void) => {
    if (isDirty) setPendingAction(() => action)
    else action()
  }

  const dialog = (
    <BaseDialog
      open={!!pendingAction}
      setOpen={(o: boolean) => !o && setPendingAction(null)}
      title="Pending changes"
      description="You have unsaved changes. How do you want to continue?"
      footer={
        <div className="flex w-full flex-col gap-2 md:flex-row-reverse">
          <DialogClose className="w-full md:flex-1" asChild>
            <Button type="button">Keep editing</Button>
          </DialogClose>
          <Button
            variant="outline"
            className="w-full md:flex-1"
            onClick={() => {
              pendingAction?.()
              setPendingAction(null)
            }}
          >
            Discard changes
          </Button>
        </div>
      }
    />
  )

  return { guard, pendingChangesDialog: dialog }
}
