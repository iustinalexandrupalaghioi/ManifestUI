"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";

function CustomYesNoSwitch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const t = useTranslations("Common");
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base track styles
        "peer relative inline-flex h-7 w-12 shrink-0 items-center rounded-lg border border-transparent shadow-xs transition-all outline-none",
        // Light mode
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-accent",
        // Dark mode improvements
        "dark:data-[state=checked]:bg-primary/80 dark:data-[state=unchecked]:bg-muted",
        // Focus ring
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Base thumb
          "group pointer-events-none relative flex size-6 items-center justify-center rounded-md transition-transform",
          // Move thumb
          "data-[state=checked]:translate-x-[90%] data-[state=unchecked]:translate-x-0",
          // Light mode colors
          "bg-background data-[state=checked]:bg-background",
          // Dark mode colors
          "dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
          // Text color contrast
          "text-foreground dark:text-background",
        )}
      >
        <span
          aria-hidden
          className="hidden text-[10px] font-semibold uppercase group-data-[state=checked]:inline"
        >
          {t("yes")}
        </span>
        <span
          aria-hidden
          className="hidden text-[10px] font-semibold uppercase group-data-[state=unchecked]:inline"
        >
          {t("no")}
        </span>
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { CustomYesNoSwitch };
