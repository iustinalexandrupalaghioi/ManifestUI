"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ICON_SIZE = 16;

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "light") {
    return <Sun size={ICON_SIZE} className="text-muted-foreground" />;
  }
  if (theme === "dark") {
    return <Moon size={ICON_SIZE} className="text-muted-foreground" />;
  }
  return <Laptop size={ICON_SIZE} className="text-muted-foreground" />;
}

function ThemeRadioItems() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuRadioGroup
      value={theme}
      onValueChange={(value) => setTheme(value as Theme)}
    >
      <DropdownMenuRadioItem className="flex gap-2" value="light">
        <Sun size={ICON_SIZE} className="text-muted-foreground" />{" "}
        <span>Light</span>
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem className="flex gap-2" value="dark">
        <Moon size={ICON_SIZE} className="text-muted-foreground" />{" "}
        <span>Dark</span>
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem className="flex gap-2" value="system">
        <Laptop size={ICON_SIZE} className="text-muted-foreground" />{" "}
        <span>System</span>
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  );
}

// Standalone trigger, used as its own button in the site, CMS and studio
// navbars.
const ThemeSwitcher = ({
  size = "sm",
  label,
  variant = "outline",
  className,
}: {
  size?: "sm" | "icon-sm" | "icon";
  /** Accessible name for the icon-only trigger. */
  label?: string;
  variant?: "outline" | "ghost";
  className?: string;
} = {}) => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Keep the slot so the navbar does not shift once the theme is known.
    return size === "sm" ? null : <span aria-hidden className={size === "icon" ? "size-8" : "size-7"} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} aria-label={label} title={label} className={className}>
          <ThemeIcon theme={theme} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <ThemeRadioItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Nested submenu, for embedding inside another dropdown menu (currently
// unused: the navbars show the standalone trigger).
function ThemeMenuSub({ label }: { label: string }) {
  const { theme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ThemeIcon theme={theme} />
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <ThemeRadioItems />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export { ThemeSwitcher, ThemeMenuSub };
