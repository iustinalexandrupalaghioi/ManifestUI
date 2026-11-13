"use client";

import { useMemo, type ReactNode } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { TranslatableText } from "@/framework/types/i18n-types";
import { FormFieldBase } from "@/framework/components/form/form-fields/FormFieldBase";
import {
  getDetailExtension,
  getOverviewExtension,
  parseExtensionProps,
  type AnyExtension,
  type BlockComponentDef,
  type ExtensionRef,
  type FieldComponentDef,
} from "./registry";

function useParsedProps(def: Pick<AnyExtension, "type" | "props">, props: unknown) {
  return useMemo(() => parseExtensionProps(def, props), [def, props]);
}

function ExtensionError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </div>
  );
}

export function ExtensionField({
  def,
  field,
  item,
  disabled,
  readOnly,
  className,
}: {
  def: FieldComponentDef;
  field: { name: string; label: TranslatableText; props?: unknown };
  item?: Record<string, unknown>;
  disabled: boolean;
  readOnly: boolean;
  className?: string;
}) {
  const { control } = useFormContext();
  const locale = useLocale();
  const parsed = useParsedProps(def, field.props);
  const label = resolveLabel(field.label, locale);
  const Component = def.component;

  if (!parsed.ok) return <ExtensionError message={parsed.error} />;

  return (
    <Controller
      control={control}
      name={field.name}
      render={({ field: input, fieldState }) => {
        const content = (
          <Component
            id={field.name}
            name={field.name}
            label={label}
            value={input.value}
            onChange={input.onChange}
            onBlur={input.onBlur}
            error={fieldState.error?.message}
            disabled={disabled}
            readOnly={readOnly}
            props={parsed.props}
            item={item}
          />
        );
        return def.bare ? (
          <div className={className}>{content}</div>
        ) : (
          <FormFieldBase label={label} id={field.name} error={fieldState.error?.message} className={className}>
            {content}
          </FormFieldBase>
        );
      }}
    />
  );
}

export function ExtensionBlock({
  def,
  props,
  item,
  disabled = false,
  readOnly = false,
}: {
  def: BlockComponentDef;
  props?: unknown;
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const form = useFormContext();
  const values = useWatch({ control: form.control });
  const parsed = useParsedProps(def, props);
  const Component = def.component;

  if (!parsed.ok) return <ExtensionError message={parsed.error} />;
  return (
    <Component
      props={parsed.props}
      values={{ ...item, ...values }}
      form={form}
      item={item}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}

function DetailExtension({ extension, item, tab }: {
  extension: ExtensionRef;
  item: unknown;
  tab?: { formOpen: boolean; basePath: string };
}) {
  const def = getDetailExtension(extension.type);
  const parsed = useParsedProps(def ?? { type: extension.type }, extension.props);
  if (!def) return <ExtensionError message={`Detail component "${extension.type}" is not registered.`} />;
  if (!parsed.ok) return <ExtensionError message={parsed.error} />;
  const Component = def.component;
  return <Component item={item} props={parsed.props} tab={tab} />;
}

export function renderDetailExtension(
  extension: ExtensionRef,
  item: unknown,
  tab?: { formOpen: boolean; basePath: string },
) {
  return <DetailExtension extension={extension} item={item} tab={tab} />;
}

/** Renders a detail slot given as a function or as a `{ type, props }` reference. */
export function renderDetailSlot<TItem>(
  slot: ((item: TItem) => ReactNode) | ExtensionRef | undefined,
  item: TItem | undefined,
): ReactNode {
  if (!slot || item === undefined || item === null) return undefined;
  return typeof slot === "function" ? slot(item) : renderDetailExtension(slot, item);
}

function OverviewExtension({ extension, context }: {
  extension: ExtensionRef;
  context: { items: unknown[]; total: number; selectedRows: unknown[] };
}) {
  const def = getOverviewExtension(extension.type);
  const parsed = useParsedProps(def ?? { type: extension.type }, extension.props);
  if (!def) return <ExtensionError message={`Overview component "${extension.type}" is not registered.`} />;
  if (!parsed.ok) return <ExtensionError message={parsed.error} />;
  const Component = def.component;
  return <Component {...context} props={parsed.props} />;
}

/** Renders an overview slot; `call` adapts the legacy function signature of that slot. */
export function renderOverviewSlot<F extends (...args: never[]) => ReactNode>(
  slot: F | ExtensionRef | undefined,
  context: { items: unknown[]; total: number; selectedRows: unknown[] },
  call: (fn: F) => ReactNode,
): ReactNode {
  if (!slot) return undefined;
  return typeof slot === "function" ? call(slot) : <OverviewExtension extension={slot} context={context} />;
}
