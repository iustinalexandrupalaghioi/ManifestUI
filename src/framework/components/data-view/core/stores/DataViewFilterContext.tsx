"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  FilterableColumn,
  FilterRule,
} from "../../features/filtering/filters";

interface DataViewFilterCtx {
  enrichedPreFilters: FilterRule[];
  filterableColumns: FilterableColumn[];
}

const DataViewFilterContext = createContext<DataViewFilterCtx | null>(null);

export function useDataViewFilter(): DataViewFilterCtx {
  const ctx = useContext(DataViewFilterContext);
  if (!ctx) {
    throw new Error(
      "useDataViewFilter must be used within a <DataView> component.",
    );
  }
  return ctx;
}

/** The same, or null outside a <DataView> (for parts that also render on their own). */
export function useOptionalDataViewFilter(): DataViewFilterCtx | null {
  return useContext(DataViewFilterContext);
}

export function DataViewFilterProvider({
  value,
  children,
}: {
  value: DataViewFilterCtx;
  children: ReactNode;
}) {
  return (
    <DataViewFilterContext.Provider value={value}>
      {children}
    </DataViewFilterContext.Provider>
  );
}
