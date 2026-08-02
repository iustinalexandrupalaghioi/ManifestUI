"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import {
  FormProvider,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form"
import { FormIdContext } from "@/framework/components/form/contexts/FormIdContext"
import {
  UploadRegistryContext,
  type UploadRegistry,
} from "@/framework/registry/UploadRegistryContext"
import { useUploadRegistry } from "@/framework/registry/useUploadRegistry"
import { useUploadStore } from "@/framework/components/form/hooks/useUploadStore"

// ─── Context ──────────────────────────────────────────────────────────────────

interface RecordScreenContextValue {
  registry: UploadRegistry
  formId: string
}

const RecordScreenContext = createContext<RecordScreenContextValue | null>(null)

export function useRecordScreen(): RecordScreenContextValue {
  const ctx = useContext(RecordScreenContext)
  if (!ctx)
    throw new Error("useRecordScreen must be used inside <RecordScreen>")
  return ctx
}

// ─── RecordScreen ─────────────────────────────────────────────────────────────

interface RecordScreenProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>
  formId: string
  children: ReactNode
  onSubmit?: () => void
}

export function RecordScreen<TFormValues extends FieldValues>({
  form,
  formId,
  children,
  onSubmit,
}: RecordScreenProps<TFormValues>) {
  const registry = useUploadRegistry()

  useEffect(() => {
    return () => {
      const state = useUploadStore.getState()
      if (!state.uploadingForms.has(formId)) state.clearAll(formId)
    }
  }, [formId])

  return (
    <RecordScreenContext value={{ registry, formId }}>
      <FormIdContext value={formId}>
        <UploadRegistryContext value={registry}>
          <FormProvider {...form}>
            {onSubmit ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onSubmit()
                }}
              >
                {children}
                <button type="submit" className="hidden" />
              </form>
            ) : (
              children
            )}
          </FormProvider>
        </UploadRegistryContext>
      </FormIdContext>
    </RecordScreenContext>
  )
}

// ─── RegistryCapture ──────────────────────────────────────────────────────────
// Renders null. Reads registry from context and writes it into a ref owned
// by the parent — lets onSave/onReset access the registry without a prop.

export function RegistryCapture({
  registryRef,
}: {
  registryRef: React.RefObject<UploadRegistry | null>
}) {
  const { registry } = useRecordScreen()
  registryRef.current = registry
  return null
}
