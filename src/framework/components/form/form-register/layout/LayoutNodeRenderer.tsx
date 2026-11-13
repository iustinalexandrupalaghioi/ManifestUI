"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale } from "next-intl";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/framework/lib/utils";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type {
  Breakpoint,
  ButtonNode,
  CardNode,
  FieldConfig,
  FlexAlign,
  FlexJustify,
  GridContainerNode,
  LayoutNode,
  StackContainerNode,
  TextNode,
  TabsNode,
  TextTone,
} from "../../types/types";
import { FieldRenderer } from "../FieldRenderer";
import { gapValue, placementStyle, type ParentInfo } from "../../lib/placement";
import { breakpointIndex, resolveResp } from "../../lib/responsive";
import { isFieldNode, parseAreas } from "../../lib/walkLayout";
import { FormButton } from "./FormButton";
import { ListNodeView } from "./ListNodeView";
import { PickupValue } from "./PickupValue";
import { useLayoutBreakpoint, useLayoutRenderContext } from "./LayoutContext";
import { getBlockExtension } from "@/framework/extensions/registry";
import { ExtensionBlock } from "@/framework/extensions/renderers";

// ─────────────────────────────────────────────
// Frame: placement + visibility for every node
// ─────────────────────────────────────────────

interface NodeProps {
  node: LayoutNode<any>;
  parent: ParentInfo;
}

/**
 * Wraps one node in a cell that carries its placement (span, area, order,
 * grow, …) and hides it when `hidden` says so. Only nodes whose `hidden` is a
 * function subscribe to form values.
 */
export function LayoutNodeRenderer({ node, parent }: NodeProps) {
  if (typeof node.hidden === "function") {
    return <WatchedFrame node={node} parent={parent} />;
  }
  if (node.hidden) return null;
  return <Frame node={node} parent={parent} />;
}

function WatchedFrame({ node, parent }: NodeProps) {
  const { control } = useFormContext();
  const values = useWatch({ control });
  const { item } = useLayoutRenderContext();
  const hidden = node.hidden as (ctx?: Record<string, unknown>) => boolean;
  if (hidden({ ...item, ...values } as Record<string, unknown>)) return null;
  return <Frame node={node} parent={parent} />;
}

function Frame({ node, parent }: NodeProps) {
  const field = isFieldNode(node);
  // A picked-record value sizes like a field inside a row.
  const style = placementStyle(node, parent, field || node.type === "pickupvalue");
  return (
    <div
      className={cn(
        "min-w-0",
        !field && node.className,
        resolveResp(node.hideOn, parent.bp) && "hidden",
      )}
      style={Object.keys(style).length ? style : undefined}
    >
      <NodeContent node={node} />
    </div>
  );
}

function NodeContent({ node }: { node: LayoutNode<any> }) {
  const { item, disabled, readOnly, slots } = useLayoutRenderContext();
  const locale = useLocale();

  switch (node.type) {
    case "grid":
      return <GridContainer node={node} />;
    case "row":
    case "column":
      return <StackContainer node={node} />;
    case "card":
      return <Card node={node} />;
    case "tabs":
      return <Tabs node={node} />;
    case "list":
      return <ListNodeView node={node} />;
    case "pickupvalue":
      return <PickupValue node={node} />;
    case "button":
      return <FormButton node={node} />;
    case "buttons":
      return (
        <div
          className={cn(
            "flex items-center",
            node.wrap && "flex-wrap",
            node.align === "center" && "justify-center",
            node.align === "end" && "justify-end",
            node.align === "between" && "justify-between",
          )}
          style={{ gap: gapValue(node.gap, 2) }}
        >
          {renderButtons(node.children)}
        </div>
      );
    case "heading": {
      const sizes = {
        1: "text-xl font-semibold",
        2: "text-lg font-semibold",
        3: "text-base font-medium",
        4: "text-sm font-medium text-muted-foreground",
      } as const;
      return (
        <div className="flex flex-col gap-0.5">
          <div role="heading" aria-level={(node.level ?? 2) + 1} className={sizes[node.level ?? 2]}>
            {resolveLabel(node.text, locale)}
          </div>
          {node.description && (
            <p className="text-sm text-muted-foreground">
              {resolveLabel(node.description, locale)}
            </p>
          )}
        </div>
      );
    }
    case "divider":
      return node.label ? (
        <div className="flex items-center gap-3 text-xs text-muted-foreground" role="separator">
          <span className="h-px flex-1 bg-border" />
          {resolveLabel(node.label, locale)}
          <span className="h-px flex-1 bg-border" />
        </div>
      ) : (
        <hr className="border-t" />
      );
    case "text":
      return typeof node.text === "function" ? (
        <DynamicText node={node} />
      ) : (
        <TextView node={node}>{resolveLabel(node.text, locale)}</TextView>
      );
    case "spacer":
      return <div aria-hidden />;
    case "slot": {
      const slot = slots?.[node.name];
      return <>{typeof slot === "function" ? slot() : (slot ?? null)}</>;
    }
    default: {
      const block = getBlockExtension(node.type);
      if (block) {
        return (
          <ExtensionBlock
            def={block}
            props={"props" in node ? node.props : undefined}
            item={item}
            disabled={disabled}
            readOnly={readOnly}
          />
        );
      }
      return (
        <FieldRenderer<Record<string, any>>
          field={node as FieldConfig<Record<string, any>>}
          item={item}
          disabled={disabled}
          readOnly={readOnly}
        />
      );
    }
  }
}

// ─────────────────────────────────────────────
// Containers
// ─────────────────────────────────────────────

function GridContainer({ node }: { node: GridContainerNode<any> }) {
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

function StackContainer({ node }: { node: StackContainerNode<any> }) {
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

function Card({ node }: { node: CardNode<any> }) {
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

function Tabs({ node }: { node: TabsNode<any> }) {
  const locale = useLocale();
  const { ref, bp } = useLayoutBreakpoint();
  const [active, setActive] = useState(node.defaultTab ?? node.tabs[0]?.key);

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div role="tablist" className="flex flex-wrap gap-1 border-b">
        {node.tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
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
      {/* Every pane stays mounted; inactive ones are only hidden. */}
      {node.tabs.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          className={cn("flex flex-col", active !== t.key && "hidden")}
          style={{ gap: gapValue(resolveResp(node.gap, bp), 4) }}
        >
          {renderChildren(t.children, { kind: "flex", bp, direction: "column" })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Content helpers
// ─────────────────────────────────────────────

const TONE_CLASS: Record<TextTone, string> = {
  default: "",
  muted: "text-muted-foreground",
  info: "rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-blue-700 dark:text-blue-300",
  success: "rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-green-700 dark:text-green-300",
  warning: "rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300",
  destructive: "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive",
};

const TEXT_SIZE = { xs: "text-xs", sm: "text-sm", md: "text-base" } as const;

function TextView({ node, children }: { node: TextNode; children: ReactNode }) {
  return (
    <div className={cn(TEXT_SIZE[node.size ?? "sm"], TONE_CLASS[node.tone ?? "default"])}>
      {children}
    </div>
  );
}

function DynamicText({ node }: { node: TextNode }) {
  const { control } = useFormContext();
  const values = useWatch({ control });
  const { item } = useLayoutRenderContext();
  const render = node.text as (ctx: Record<string, unknown>) => ReactNode;
  return (
    <TextView node={node}>
      {render({ ...item, ...values } as Record<string, unknown>)}
    </TextView>
  );
}

// ─────────────────────────────────────────────

// Buttons go through the frame too, so `hidden`, `order`, `grow`… work on them.
function renderButtons(buttons: ButtonNode<any>[]) {
  return buttons.map((b) => (
    <LayoutNodeRenderer
      key={b.key}
      node={b}
      parent={{ kind: "flex", bp: "base", direction: "row" }}
    />
  ));
}

function renderChildren(children: LayoutNode<any>[], parent: ParentInfo) {
  // The same field may legitimately appear twice among siblings, so
  // disambiguate repeated keys instead of colliding.
  const seen = new Map<string, number>();
  return children.map((child, i) => {
    const base =
      child.key ?? ("name" in child ? `${child.type}:${child.name}` : `${child.type}:${i}`);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return (
      <LayoutNodeRenderer
        key={count ? `${base}#${count}` : base}
        node={child}
        parent={parent}
      />
    );
  });
}

export type { Breakpoint };
