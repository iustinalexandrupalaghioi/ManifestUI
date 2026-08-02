import type React from "react"
import type { Table } from "@tanstack/react-table"

/**
 * DataViewFeature
 *
 * The shared contract every data-table feature implements.
 * DataView discovers features through this interface and never
 * imports feature modules directly after this phase.
 *
 * Rules:
 * - id must be unique across all registered features.
 * - useFeature is called once per render inside useDataView via a for loop.
 *   The features array must therefore be a stable module-level constant —
 *   never constructed inline or inside a component body.
 * - Toolbar and Panel are optional. If absent, no slot is rendered.
 */
export interface DataViewFeature {
  readonly id: string
  useFeature?<TData>(ctx: DataViewFeatureContext<TData>): void
  Toolbar?: React.ComponentType
  Panel?: React.ComponentType
}

/**
 * DataViewFeatureContext
 *
 * Passed to useFeature on every call. Gives features access to the
 * table instance and tableId without coupling them to DataView internals.
 *
 * TData flows from useDataView's own TData through the generic useFeature
 * method, so getTable() returns a properly typed Table<TData> at each
 * call site without requiring DataViewFeature itself to be generic.
 */
export interface DataViewFeatureContext<TData> {
  tableId: string
  getTable(): Table<TData>
}
