"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type DefaultValues,
} from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import { unwrapAction } from "@/framework/lib/actionResult";
import type { createKeys } from "./create-list-hooks";
import type { ResourceConfig, ResourceId } from "../../types/resource-hook-types";
import { getItemId } from "../resource-id";

export function createFormHooks<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  config: ResourceConfig<TItem, TFormValues, TId>,
  keys: ReturnType<typeof createKeys<TItem, TFormValues, TId>>,
) {
  const { schema, emptyValues, fetchDetail, idField = "id" } = config;

  const TIME_WITH_FRACTION = /^(\d{2}:\d{2}:\d{2})\.\d+$/;
  const DATETIME_WITH_FRACTION =
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.\d+(Z|[+-]\d{2}:\d{2})?$/;

  function stripFractionalSeconds(v: unknown): unknown {
    if (typeof v !== "string") return v;

    const timeMatch = v.match(TIME_WITH_FRACTION);
    if (timeMatch) return timeMatch[1];

    const dateTimeMatch = v.match(DATETIME_WITH_FRACTION);
    if (dateTimeMatch) return dateTimeMatch[1] + (dateTimeMatch[2] ?? "");

    return v;
  }

  const coerceNulls = (obj: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        if (v !== null && v !== undefined)
          return [k, stripFractionalSeconds(v)];

        const fieldSchema = (schema as z.ZodObject<z.ZodRawShape>).shape?.[k];
        const unwrapped =
          fieldSchema instanceof z.ZodOptional
            ? fieldSchema.unwrap()
            : fieldSchema;
        if (unwrapped instanceof z.ZodNumber) return [k, 0];
        if (unwrapped instanceof z.ZodBoolean) return [k, false];
        return [k, ""];
      }),
    ) as TFormValues;

  const parseItem = (item: TItem) => {
    try {
      return schema.parse(coerceNulls(item as Record<string, unknown>));
    } catch {
      return coerceNulls({
        ...(emptyValues as Record<string, unknown>),
        ...(item as Record<string, unknown>),
      });
    }
  };

  // ── useAddForm ──────────────────────────────

  function useAddForm(initial?: Partial<TFormValues>) {
    const form = useForm<TFormValues>({
      resolver: zodResolver(schema) as Resolver<TFormValues>,
      defaultValues: {
        ...emptyValues,
        ...initial,
      } as DefaultValues<TFormValues>,
      mode: "onChange",
      reValidateMode: "onChange",
    });

    return {
      form,
      isDirty: form.formState.isDirty,
      canSave: form.formState.isValid,
      handleSubmit: form.handleSubmit,
      reset: () => form.reset(emptyValues),
    };
  }

  // ── useDetailForm ───────────────────────────

  function useDetailForm(item: TItem) {
    const defaults = item ? parseItem(item) : (emptyValues as TFormValues);

    const form = useForm<TFormValues>({
      resolver: zodResolver(schema) as Resolver<TFormValues>,
      defaultValues: defaults as DefaultValues<TFormValues>,
      mode: "onChange",
    });

    useEffect(() => {
      form.reset(defaults);
      form.clearErrors();
    }, [getItemId(item as Record<string, unknown>, idField)]);

    return {
      form,
      isDirty: form.formState.isDirty,
      canSave: form.formState.isValid,
      handleSubmit: form.handleSubmit,
      reset: () => form.reset(defaults),
      confirmSaved: (data: TFormValues) => form.reset(data),
    };
  }

  // ── useDetailPageForm ───────────────────────

  function useDetailPageForm(id: string | number) {
    const {
      data: item,
      isError,
      isFetching,
      dataUpdatedAt,
    } = useQuery({
      queryKey: keys.detail(id),
      queryFn: () => fetchDetail(id as TId).then(unwrapAction),
      enabled: id !== undefined && id !== null && id !== "",
      placeholderData: keepPreviousData,
    });

    const defaults = item ? parseItem(item) : (emptyValues as TFormValues);

    const form = useForm<TFormValues>({
      resolver: zodResolver(schema) as Resolver<TFormValues>,
      defaultValues: defaults as DefaultValues<TFormValues>,
      mode: "onChange",
    });

    useEffect(() => {
      if (item && !isFetching) {
        form.reset(parseItem(item), {
          keepErrors: false,
          keepDirty: false,
          keepTouched: false,
        });
      }
    }, [item, isFetching]);

    return {
      form,
      item,
      isError,
      isFetching,
      dataUpdatedAt,
      isDirty: form.formState.isDirty,
      canSave: form.formState.isValid,
      handleSubmit: form.handleSubmit,
      reset: () => {
        if (item) form.reset(parseItem(item) as TFormValues);
      },
      confirmSaved: (data: TFormValues) => form.reset(data),
    };
  }

  return { useAddForm, useDetailForm, useDetailPageForm };
}
