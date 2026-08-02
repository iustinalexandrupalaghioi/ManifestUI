import type { FieldValues } from "react-hook-form";

import type { DefinedResourceConfig } from "../types/define-resource-type";
import type { ResourceId } from "../types/resource-hook-types";
import { createResourceHooks } from "./hooks/create-resource-hooks";

export function defineResourceHooks<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(config: DefinedResourceConfig<TItem, TFormValues, TId>) {
  const hooks = createResourceHooks(config);
  return { hooks, config };
}
