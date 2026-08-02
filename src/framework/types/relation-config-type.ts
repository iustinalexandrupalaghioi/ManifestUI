import type { FieldValues } from "react-hook-form";
import type { ResourceHooks } from "@/framework/core/hooks/create-resource-hooks";
import type { FilterInput } from "../components/data-view/features/filtering/filters";

export interface ChildResource<TItem, TFormValues extends FieldValues> {
  // TId left as `any` — a relation's child can have any id shape (number,
  // string, or a composite-string like role-permissions'/user-roles' own
  // synthetic ids); this config only ever renders the child's own
  // components/hooks, never constructs a child TId itself.
  hooks: ResourceHooks<TItem, TFormValues, any>;
  components: {
    Overview: React.ComponentType<{
      preFilters?: FilterInput[];
      slotId?: string;
      height?: number;
      popOutUrl?: string;
    }>;
    AddPage: React.ComponentType;
    DetailPage: React.ComponentType;
    AddDialog: React.ComponentType<{
      open: boolean;
      setOpen: (o: boolean) => void;
      initial?: Partial<TFormValues>;
    }>;
    DetailDialog: React.ComponentType<{
      item: TItem;
      open: boolean;
      setOpen: (o: boolean) => void;
    }>;
    LookupDialog: React.ComponentType<any>;
  };
}

export interface RelationConfig<
  TParent,
  TChild = any,
  TChildFormValues extends FieldValues = any,
> {
  key: string;
  childResource: ChildResource<TChild, TChildFormValues>;
  filter: (item: TParent) => FilterInput[];
  popOutUrl?: string;
  invalidateOn?: Array<"add" | "update" | "delete">;
}
