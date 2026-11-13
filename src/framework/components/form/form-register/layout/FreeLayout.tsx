"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { cn } from "@/framework/lib/utils";
import type {
  FormRegions,
  LayoutNode,
  StackContainerNode,
} from "../../types/types";
import { useContainerBreakpoint } from "../../hooks/useContainerBreakpoint";
import { collectPickups, validateFreeLayout } from "../../lib/walkLayout";
import { LayoutNodeRenderer } from "./LayoutNodeRenderer";
import { LayoutRenderProvider } from "./LayoutContext";

interface FreeLayoutProps<T> {
  root: LayoutNode<T>;
  regions?: FormRegions<T>;
  className: string;
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
  slots?: Record<string, ReactNode | (() => ReactNode)>;
}

/** Renders a `mode: "free"` layout tree plus the header/footer/floating regions. */
export function FreeLayout<T>({
  root,
  className,
  item,
  disabled,
  readOnly,
  slots,
  regions,
}: FreeLayoutProps<T>) {
  const { ref, bp } = useContainerBreakpoint();
  const pickups = useMemo(() => collectPickups(root, regions), [root, regions]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    validateFreeLayout(root, regions).forEach((p) =>
      console.warn(`[form layout] ${p}`),
    );
  }, [root, regions]);

  return (
    <LayoutRenderProvider value={{ item, disabled, readOnly, slots, free: true, pickups, bp }}>
      <div ref={ref} className={className}>
        <LayoutNodeRenderer node={root} parent={{ kind: "root", bp }} />
      </div>
    </LayoutRenderProvider>
  );
}

// ─────────────────────────────────────────────
// Regions (shared by every layout mode)
// ─────────────────────────────────────────────

const ROW = (children: LayoutNode<any>[]): StackContainerNode<any> => ({
  type: "row",
  gap: 2,
  align: "center",
  wrap: true,
  children,
});

function RegionNodes({ nodes }: { nodes: LayoutNode<any>[] }) {
  if (!nodes.length) return null;
  // The row measures itself; the root parent info only matters for its own placement.
  return <LayoutNodeRenderer node={ROW(nodes)} parent={{ kind: "root", bp: "base" }} />;
}

const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

const FLOAT_POS = {
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6",
} as const;

export function RegionsWrapper<T>({
  regions,
  className,
  item,
  disabled,
  readOnly,
  slots,
  children,
}: {
  regions: FormRegions<T>;
  className: string;
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
  slots?: Record<string, ReactNode | (() => ReactNode)>;
  children: ReactNode;
}) {
  const { header, footer, floating } = regions;

  return (
    <LayoutRenderProvider value={{ item, disabled, readOnly, slots }}>
      <div className={cn("flex flex-col gap-4", className)}>
        {header && (
          <div className={cn("flex items-center justify-between gap-3", header.className)}>
            <div className="flex flex-1 items-center justify-start">
              <RegionNodes nodes={header.left ?? []} />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <RegionNodes nodes={header.center ?? []} />
            </div>
            <div className="flex flex-1 items-center justify-end">
              <RegionNodes nodes={header.right ?? []} />
            </div>
          </div>
        )}

        {children}

        {footer && (
          <div
            className={cn(
              "flex items-center gap-2 py-3",
              JUSTIFY[footer.align ?? "end"],
              footer.sticky && "sticky bottom-0 z-10 bg-background",
              (footer.bordered ?? !!footer.sticky) && "border-t",
              footer.className,
            )}
          >
            <RegionNodes nodes={footer.children} />
          </div>
        )}

        {floating && (
          <div
            className={cn(
              "fixed z-30 flex items-center gap-2",
              FLOAT_POS[floating.position ?? "bottom-right"],
              floating.className,
            )}
          >
            <RegionNodes nodes={floating.children} />
          </div>
        )}
      </div>
    </LayoutRenderProvider>
  );
}
