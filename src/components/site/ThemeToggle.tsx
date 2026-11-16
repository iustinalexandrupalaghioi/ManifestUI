"use client";

import { useEffect, useState } from "react";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; Icon: typeof SunIcon }[] = [
  { value: "light", Icon: SunIcon },
  { value: "dark", Icon: MoonIcon },
  { value: "system", Icon: LaptopIcon },
];

/**
 * Light / Dark / System as a segmented control (the mobile menu and footer).
 * Renders the chosen option only after mount, since the stored theme lives in
 * localStorage and isn't known on the server.
 */
export function ThemeToggle({
  label,
  names,
  className,
}: {
  label: string;
  names: Record<Theme, string>;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div role="group" aria-label={label} className={cn("flex rounded-[10px] border p-[3px]", className)}>
      {OPTIONS.map(({ value, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-[7px] px-3 text-sm font-medium transition-colors",
              active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
            <span>{names[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
