"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import {
  FormProvider,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { FormIdContext } from "@/framework/components/form/contexts/FormIdContext";
import {
  UploadRegistryContext,
  type UploadRegistry,
} from "@/framework/registry/UploadRegistryContext";
import { useUploadRegistry } from "@/framework/registry/useUploadRegistry";
import { useUploadStore } from "@/framework/components/form/hooks/useUploadStore";

// ─── Context ──────────────────────────────────────────────────────────────────

interface RecordScreenContextValue {
  registry: UploadRegistry;
  formId: string;
  insideForm: boolean;
}

const RecordScreenContext = createContext<RecordScreenContextValue | null>(
  null,
);

export function useRecordScreen(): RecordScreenContextValue {
  const ctx = useContext(RecordScreenContext);
  if (!ctx)
    throw new Error("useRecordScreen must be used inside <RecordScreen>");
  return ctx;
}

// ─── RecordScreen ─────────────────────────────────────────────────────────────

interface RecordScreenProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  formId: string;
  children: ReactNode;
  onSubmit?: () => void;
  className?: string;
}

export function RecordScreen<TFormValues extends FieldValues>({
  form,
  formId,
  children,
  onSubmit,
  className,
}: RecordScreenProps<TFormValues>) {
  const registry = useUploadRegistry();
  const parentCtx = useContext(RecordScreenContext);
  const nestedInForm = !!parentCtx?.insideForm;

  useEffect(() => {
    return () => {
      const state = useUploadStore.getState();
      if (!state.uploadingForms.has(formId)) state.clearAll(formId);
    };
  }, [formId]);

  const renderForm = !!onSubmit && !nestedInForm;

  return (
    <RecordScreenContext
      value={{ registry, formId, insideForm: renderForm || nestedInForm }}
    >
      <FormIdContext value={formId}>
        <UploadRegistryContext value={registry}>
          <FormProvider {...form}>
            {renderForm ? (
              <form
                className={className}
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmit!();
                }}
              >
                {children}
                <button type="submit" className="hidden" />
              </form>
            ) : onSubmit ? (
              <div className={className}>{children}</div>
            ) : (
              children
            )}
          </FormProvider>
        </UploadRegistryContext>
      </FormIdContext>
    </RecordScreenContext>
  );
}

// ─── RegistryCapture ──────────────────────────────────────────────────────────
// Renders null. Reads registry from context and writes it into a ref owned
// by the parent — lets onSave/onReset access the registry without a prop.

export function RegistryCapture({
  registryRef,
}: {
  registryRef: React.RefObject<UploadRegistry | null>;
}) {
  const { registry } = useRecordScreen();
  registryRef.current = registry;
  return null;
}
