"use client";

import { useId, useState, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/framework/lib/utils";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { CardNode, FlexAlign, FlexJustify, GridContainerNode, LayoutNode, StackContainerNode, TabsNode } from "../../types/types";
import { gapValue, type ParentInfo } from "../../lib/placement";
import { breakpointIndex, resolveResp } from "../../lib/responsive";
import { parseAreas, walkLayout } from "../../lib/walkLayout";
import { useLayoutBreakpoint } from "./LayoutContext";
import { renderButtons, renderChildren } from "./renderLayoutNodes";

/*
 * Layout containers: grid, row/column, card and tabs. Each measures its own
 * width for responsive values and lays out its children through
 * renderChildren (which frames every child with its placement).
 */

export function GridContainer({ node }: { node: GridContainerNode<any> }) {
  const { ref, bp } = useLayoutBreakpoint();

  const areas = resolveResp(node.areas, bp);
  const colsRaw = resolveResp(node.cols, bp);
  const areaCols = areas ? (parseAreas(areas)[0]?.length ?? 1) : undefined;
  const cols = colsRaw ?? areaCols ?? 1;

  const style: CSSProperties = {
    display: "grid",
    gridTemplateColumns:
      typeof cols === "number" ? `repeat(${cols}, minmax(0, 1fr))` : cols,
    gridTemplateRows: resolveResp(node.rows, bp),
    gridTemplateAreas: areas,
    rowGap: gapValue(resolveResp(node.rowGap, bp) ?? resolveResp(node.gap, bp), 4),
    columnGap: gapValue(resolveResp(node.colGap, bp) ?? resolveResp(node.gap, bp), 4),
  };

  const parent: ParentInfo = {
    kind: "grid",
    bp,
    cols: typeof cols === "number" ? cols : undefined,
  };

  return (
    <div ref={ref} style={style}>
      {renderChildren(node.children, parent)}
    </div>
  );
}

const ALIGN_ITEMS: Record<FlexAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};
const JUSTIFY: Record<FlexJustify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
};

export function StackContainer({ node }: { node: StackContainerNode<any> }) {
  const { ref, bp } = useLayoutBreakpoint();

  const stacked =
    node.type === "row" &&
    node.stackBelow !== undefined &&
    breakpointIndex(bp) < breakpointIndex(node.stackBelow);
  const direction = node.type === "column" || stacked ? "column" : "row";

  const align = resolveResp(node.align, bp);
  const justify = resolveResp(node.justify, bp);

  const style: CSSProperties = {
    display: "flex",
    flexDirection: direction,
    flexWrap: node.wrap ? "wrap" : undefined,
    gap: gapValue(resolveResp(node.gap, bp), 4),
    alignItems: align ? ALIGN_ITEMS[align] : undefined,
    justifyContent: justify ? JUSTIFY[justify] : undefined,
  };

  return (
    <div ref={ref} style={style}>
      {renderChildren(node.children, { kind: "flex", bp, direction })}
    </div>
  );
}

export function Card({ node }: { node: CardNode<any> }) {
  const locale = useLocale();
  const { ref, bp } = useLayoutBreakpoint();
  const [collapsed, setCollapsed] = useState(!!node.defaultCollapsed);
  const bordered = node.bordered !== false;
  const hasHeader = node.title || node.description || node.actions?.length;

  const title = node.title && (
    <span className="text-sm font-medium">{resolveLabel(node.title, locale)}</span>
  );

  return (
    <div ref={ref} className={cn(bordered && "rounded-2xl border p-4")}>
      {hasHeader && (
        <div className={cn("flex items-start justify-between gap-3", !collapsed && "mb-4")}>
          <div className="flex min-w-0 flex-col gap-0.5">
            {node.collapsible ? (
              <button
                type="button"
                className="flex items-center gap-1.5 text-left"
                aria-expanded={!collapsed}
                onClick={() => setCollapsed((c) => !c)}
              >
                <ChevronDownIcon
                  className={cn("size-4 transition-transform", collapsed && "-rotate-90")}
                />
                {title}
              </button>
            ) : (
              title
            )}
            {node.description && !collapsed && (
              <p className="text-sm text-muted-foreground">
                {resolveLabel(node.description, locale)}
              </p>
            )}
          </div>
          {node.actions && node.actions.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              {renderButtons(node.actions)}
            </div>
          )}
        </div>
      )}
      {/* Kept mounted (just hidden) so collapsing never drops form state. */}
      <div
        className={cn("flex flex-col", collapsed && "hidden")}
        style={{ gap: gapValue(resolveResp(node.gap, bp), 4) }}
      >
        {renderChildren(node.children, { kind: "flex", bp, direction: "column" })}
      </div>
    </div>
  );
}

/**
 * Node types that hold no form state, so a pane made only of them can mount the
 * first time it's opened (a tab of related lists doesn't load until it's shown).
 */
const LAZY_PANE_TYPES = new Set(["list", "heading", "text", "divider", "spacer", "grid", "row", "column", "card", "tabs"]);

function paneMountsLazily(children: LayoutNode<any>[]) {
  let lazy = true;
  for (const child of children) {
    walkLayout(child, (node) => {
      if (!LAZY_PANE_TYPES.has(node.type)) lazy = false;
    });
  }
  return lazy;
}

export function Tabs({ node }: { node: TabsNode<any> }) {
  const locale = useLocale();
  const { ref, bp } = useLayoutBreakpoint();
  const [active, setActive] = useState(node.defaultTab ?? node.tabs[0]?.key);
  // Panes opened so far: lazy panes stay mounted once shown (their lists keep their state).
  const [opened, setOpened] = useState<Set<string | undefined>>(() => new Set([active]));
  const open = (key: string) => {
    setActive(key);
    setOpened((current) => (current.has(key) ? current : new Set(current).add(key)));
  };
  const baseId = useId();

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div role="tablist" className="flex flex-wrap gap-1 border-b">
        {node.tabs.map((t) => (
          <button
            key={t.key}
            id={`${baseId}-tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            aria-controls={`${baseId}-pane-${t.key}`}
            onClick={() => open(t.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-1.5 text-sm transition-colors",
              active === t.key
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {resolveLabel(t.label, locale)}
          </button>
        ))}
      </div>
      {/* Panes with fields stay mounted (inactive ones are only hidden) so values and
          validation survive; panes of lists and text mount when first opened. */}
      {node.tabs.map((t) => (
        <div
          key={t.key}
          id={`${baseId}-pane-${t.key}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${t.key}`}
          className={cn("flex flex-col", active !== t.key && "hidden")}
          style={{ gap: gapValue(resolveResp(node.gap, bp), 4) }}
        >
          {(opened.has(t.key) || !paneMountsLazily(t.children)) &&
            renderChildren(t.children, { kind: "flex", bp, direction: "column" })}
        </div>
      ))}
    </div>
  );
}
