"use client";

import { createContext, useContext, type ReactNode } from "react";

interface FieldCollapse {
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const FieldCollapseContext = createContext<FieldCollapse>({});

export const useFieldCollapse = () => useContext(FieldCollapseContext);

// Only the field's own FormFieldBase should consume this, so wrap just the field input.
export function FieldCollapseProvider({
  collapsible,
  defaultCollapsed,
  children,
}: FieldCollapse & { children: ReactNode }) {
  if (!collapsible) return <>{children}</>;
  return (
    <FieldCollapseContext.Provider value={{ collapsible, defaultCollapsed }}>
      {children}
    </FieldCollapseContext.Provider>
  );
}
