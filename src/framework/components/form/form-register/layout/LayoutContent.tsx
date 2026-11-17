"use client";

import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale } from "next-intl";
import { cn } from "@/framework/lib/utils";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { ButtonGroupNode, DividerNode, HeadingNode, TextNode, TextTone } from "../../types/types";
import { gapValue } from "../../lib/placement";
import { useLayoutRenderContext } from "./LayoutContext";
import { renderButtons } from "./renderLayoutNodes";

/* Content nodes: headings, dividers, texts (static or computed from the form) and button rows. */

export function ButtonsRow({ node }: { node: ButtonGroupNode<any> }) {
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
}

const HEADING_SIZES = {
  1: "text-xl font-semibold",
  2: "text-lg font-semibold",
  3: "text-base font-medium",
  4: "text-sm font-medium text-muted-foreground",
} as const;

export function HeadingView({ node }: { node: HeadingNode }) {
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-0.5">
      <div role="heading" aria-level={(node.level ?? 2) + 1} className={HEADING_SIZES[node.level ?? 2]}>
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

export function DividerView({ node }: { node: DividerNode }) {
  const locale = useLocale();
  return node.label ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-border" />
      {resolveLabel(node.label, locale)}
      <span className="h-px flex-1 bg-border" />
    </div>
  ) : (
    <hr className="border-t" />
  );
}

export function TextContent({ node }: { node: TextNode }) {
  const locale = useLocale();
  return typeof node.text === "function" ? (
    <DynamicText node={node} />
  ) : (
    <TextView node={node}>{resolveLabel(node.text, locale)}</TextView>
  );
}

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
