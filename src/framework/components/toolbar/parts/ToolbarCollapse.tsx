"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";

interface ToolbarCollapseState {
  expanded: boolean;
  toggle: () => void;
  /** Search, filters, sorts and groups in effect, shown on the chevron while they're hidden. */
  activeCount: number;
}

const ToolbarCollapseContext = createContext<ToolbarCollapseState | null>(null);

/**
 * A list's toolbar on phones: only the action buttons show until the chevron
 * opens the rest (search, filters, sort, count, Cards | Table). From `sm` up
 * everything always shows.
 */
export function ToolbarCollapseProvider({
  activeCount = 0,
  children,
}: {
  activeCount?: number;
  children: (expanded: boolean) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <ToolbarCollapseContext.Provider value={{ expanded, toggle: () => setExpanded((v) => !v), activeCount }}>
      {children(expanded)}
    </ToolbarCollapseContext.Provider>
  );
}

export function useToolbarCollapse() {
  return useContext(ToolbarCollapseContext);
}

/** The chevron that opens and closes the rest of a list's toolbar; phones only, nothing outside a list. */
export function ToolbarCollapseButton({ className }: { className?: string }) {
  const t = useTranslations("Toolbar");
  const state = useToolbarCollapse();
  if (!state) return null;
  const label = state.expanded ? t("hideTools") : t("showTools");
  const badge = !state.expanded && state.activeCount > 0;
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={badge ? `${label} (${t("activeTools", { count: state.activeCount })})` : label}
      title={label}
      aria-expanded={state.expanded}
      onClick={state.toggle}
      className={cn("relative size-10 sm:hidden", className)}
    >
      <ChevronDownIcon aria-hidden className={cn("transition-transform", state.expanded && "rotate-180")} />
      {/* Like the count on Sort and Filters, so hidden filters aren't forgotten. */}
      {badge && (
        <span
          aria-hidden
          className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
        >
          {state.activeCount}
        </span>
      )}
    </Button>
  );
}
