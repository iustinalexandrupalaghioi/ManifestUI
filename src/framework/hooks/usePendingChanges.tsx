"use client"

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { BaseDialog } from "../components/dialog/BaseDialog"
import { useBeforeUnloadWarning } from "./useBeforeUnloadWarning"

/**
 * Asks before discarding unsaved changes. `guard(action)` runs `action`
 * immediately when nothing is dirty, otherwise after the user confirms.
 * With `warnOnUnload`, closing/reloading the tab also asks (browser prompt).
 */
export function usePendingChanges(
  isDirty: boolean,
  { warnOnUnload = false }: { warnOnUnload?: boolean } = {},
) {
  const t = useTranslations("Common")
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  useBeforeUnloadWarning(warnOnUnload && isDirty)

  const guard = (action: () => void) => {
    if (isDirty) setPendingAction(() => action)
    else action()
  }

  const dialog = (
    <BaseDialog
      open={!!pendingAction}
      setOpen={(o: boolean) => !o && setPendingAction(null)}
      title={t("pendingChangesTitle")}
      description={t("pendingChangesDescription")}
      footer={
        <div className="flex w-full flex-col gap-2 md:flex-row-reverse">
          <DialogClose className="w-full md:flex-1" asChild>
            <Button type="button">{t("keepEditing")}</Button>
          </DialogClose>
          <Button
            variant="outline"
            className="w-full md:flex-1"
            onClick={() => {
              pendingAction?.()
              setPendingAction(null)
            }}
          >
            {t("discardChanges")}
          </Button>
        </div>
      }
    />
  )

  return { guard, pendingChangesDialog: dialog }
}
