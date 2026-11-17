"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@/framework/lib/utils";
import type { Breakpoint, FieldConfig, LayoutNode } from "../../types/types";
import { FieldRenderer } from "../FieldRenderer";
import { placementStyle, type ParentInfo } from "../../lib/placement";
import { resolveResp } from "../../lib/responsive";
import { isFieldNode } from "../../lib/walkLayout";
import { FormButton } from "./FormButton";
import { ListNodeView } from "./ListNodeView";
import { PickupValue } from "./PickupValue";
import { useLayoutRenderContext } from "./LayoutContext";
import { Card, GridContainer, StackContainer, Tabs } from "./LayoutContainers";
import { ButtonsRow, DividerView, HeadingView, TextContent } from "./LayoutContent";
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

/** Picks the view for a node: a container, a content node, an extension block, or a field. */
function NodeContent({ node }: { node: LayoutNode<any> }) {
  const { item, disabled, readOnly, slots } = useLayoutRenderContext();

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
      return <ButtonsRow node={node} />;
    case "heading":
      return <HeadingView node={node} />;
    case "divider":
      return <DividerView node={node} />;
    case "text":
      return <TextContent node={node} />;
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

export type { Breakpoint };
