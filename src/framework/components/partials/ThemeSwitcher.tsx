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

// Standalone trigger, used in the navbar when there's no UserMenu to nest
// it under (logged-out state).
const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={"sm"}>
          <ThemeIcon theme={theme} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <ThemeRadioItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Nested submenu, used inside UserMenu's Preferences submenu (logged-in
// state) instead of a standalone trigger in the navbar.
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
