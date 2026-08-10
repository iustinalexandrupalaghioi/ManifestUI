"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState, type ReactNode } from "react";

function useIsCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsCoarse(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsCoarse(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isCoarse;
}

interface EventHoverCardProps {
  children: ReactNode;
  content?: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function EventHoverCard({
  children,
  content,
  side = "top",
}: EventHoverCardProps) {
  const isCoarse = useIsCoarsePointer();

  if (!content) return <>{children}</>;

  if (isCoarse) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          side={side}
          className="w-fit max-w-64 border border-border bg-popover p-3 text-popover-foreground"
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-64 border border-border bg-popover p-3 text-popover-foreground"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
