import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/framework/lib/utils";

function CustomYesNoSwitch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
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
          "pointer-events-none relative block size-6 rounded-md transition-transform",
          // Move thumb
          "data-[state=checked]:translate-x-[90%] data-[state=unchecked]:translate-x-0",
          // Light mode colors
          "bg-background data-[state=checked]:bg-background",
          // Dark mode colors
          "dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
          // Label text inside thumb
          "before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:text-[10px] before:font-semibold",
          "data-[state=checked]:before:content-['YES'] data-[state=unchecked]:before:content-['NO']",
          // Text color contrast
          "text-foreground dark:text-background",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { CustomYesNoSwitch };
