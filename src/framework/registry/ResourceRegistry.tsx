import type { FieldValues } from "react-hook-form"
import type { ComponentType, Dispatch, SetStateAction } from "react"
import type { ResourceHooks } from "@/framework/core/hooks/create-resource-hooks"
import type { ResourceId } from "@/framework/types/resource-hook-types"

export interface ResourceComponents {
  Overview: ComponentType
  AddPage?: ComponentType
  AddDialog?: ComponentType<any>
  DetailPage?: ComponentType
  DetailDialog?: ComponentType<any>
  PickupDialog: ComponentType<any>
}

export interface ResourceEntry<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
> {
  hooks: ResourceHooks<TItem, TFormValues, TId>
  PickupDialog: (props: {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
    onSelect?: (item: TItem) => void
  }) => React.ReactNode
  components?: ResourceComponents
}

const registry = new Map<string, ResourceEntry<any, any, any>>()

export function registerResource<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(id: string, entry: ResourceEntry<TItem, TFormValues, TId>) {
  registry.set(id, entry)
}

export function getResource<
  TItem = Record<string, unknown>,
  TFormValues extends FieldValues = FieldValues,
  TId extends ResourceId = number,
>(id: string): ResourceEntry<TItem, TFormValues, TId> | undefined {
  return registry.get(id)
}

export function getRegistry(): Map<string, ResourceEntry<any, any, any>> {
  return registry
}
