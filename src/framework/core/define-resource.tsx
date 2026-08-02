import type { FieldValues } from "react-hook-form";
import type { DefinedResourceConfig } from "../types/define-resource-type";
import type { ResourceId } from "../types/resource-hook-types";
import { defineResourceHooks } from "./define-resource-hooks";
import { defineResourceComponents } from "./define-resource-components";

export function defineResource<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(config: DefinedResourceConfig<TItem, TFormValues, TId>) {
  const { hooks } = defineResourceHooks(config);
  const { components } = defineResourceComponents(hooks, config);
  return { hooks, components, config };
}

export type { DefinedResourceConfig } from "../types/define-resource-type";
