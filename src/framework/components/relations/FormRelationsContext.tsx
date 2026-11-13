"use client";

import { createContext, use } from "react";
import type { RelationConfig } from "@/framework/types/relation-config-type";

export interface FormRelationsValue {
  relations: RelationConfig<any, any, any>[];
  idField: string;
}

const FormRelationsContext = createContext<FormRelationsValue | null>(null);

/** Provided by the detail page so `list` layout nodes can find their relation. */
export const FormRelationsProvider = FormRelationsContext.Provider;

export function useFormRelations() {
  return use(FormRelationsContext);
}
