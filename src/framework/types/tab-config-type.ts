import type { FieldValues } from "react-hook-form"
import type { ReactNode } from "react"
import type { SectionConfig } from "../components/form/types/types"

export interface TabRenderContext {
  formOpen: boolean
  basePath: string
  popOutUrl?: string
}

export interface FieldTabConfig<TFormValues extends FieldValues> {
  value: string
  label: string
  icon?: ReactNode
  sections: SectionConfig<TFormValues>[]
}

export type TabConfig<TItem, TFormValues extends FieldValues> =
  | {
      /** Fully custom tab content — you own the rendering. For relation
       *  lists driven by `ResourceConfig.relations`, use `type: "relation"`
       *  instead so the tab and the relation stay decoupled. */
      type?: "list"
      value: string
      label: string
      icon?: ReactNode
      render: (item: TItem, ctx: TabRenderContext) => ReactNode
    }
  | {
      /** Points at a `RelationConfig.key` defined in `ResourceConfig.relations`.
       *  The tab is just placement/chrome (value/label/icon) — the relation
       *  itself (child resource, filter, pop-out url) is defined once and can
       *  also be rendered outside of tabs via `<RelationList>`. */
      type: "relation"
      value: string
      label: string
      icon?: ReactNode
      relationKey: string
      height?: number
    }
  // Same shape used for `addTabs` (where only "fields" tabs are possible,
  // since an unsaved record has no relations yet) — kept as one definition
  // so the two can't drift apart.
  | ({ type: "fields" } & FieldTabConfig<TFormValues>)
