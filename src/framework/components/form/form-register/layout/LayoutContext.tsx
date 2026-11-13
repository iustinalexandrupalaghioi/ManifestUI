"use client";

import { createContext, use, type ReactNode } from "react";
import type { Breakpoint, PickupConfig } from "../../types/types";
import { useContainerBreakpoint } from "../../hooks/useContainerBreakpoint";

export interface LayoutRenderContextValue {
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
  slots?: Record<string, ReactNode | (() => ReactNode)>;
  /** True inside a `mode: "free"` layout tree (not in regions of legacy modes). */
  free?: boolean;
  /** Pickup configs of the free layout's fields, by target field name. */
  pickups?: Record<string, PickupConfig<any>>;
  /** Form-wide breakpoint; nested containers use it instead of their own width. */
  bp?: Breakpoint;
}

const LayoutRenderContext = createContext<LayoutRenderContextValue>({});

export const LayoutRenderProvider = LayoutRenderContext.Provider;

export function useLayoutRenderContext() {
  return use(LayoutRenderContext);
}

/** The form-wide breakpoint when one is provided, else the container's own. */
export function useLayoutBreakpoint<T extends HTMLElement = HTMLDivElement>() {
  const { ref, bp } = useContainerBreakpoint<T>();
  return { ref, bp: useLayoutRenderContext().bp ?? bp };
}
