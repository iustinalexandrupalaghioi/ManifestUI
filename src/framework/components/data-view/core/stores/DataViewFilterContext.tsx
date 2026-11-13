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
