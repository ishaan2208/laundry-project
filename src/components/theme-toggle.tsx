"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Avoid hydration flicker for icon state
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const icon = !mounted ? (
    <Sun className="h-5 w-5 opacity-70" />
  ) : theme === "dark" ? (
    <Moon className="h-5 w-5" />
  ) : theme === "light" ? (
    <Sun className="h-5 w-5" />
  ) : (
    <Laptop className="h-5 w-5" />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-11 w-11 rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] hover:bg-violet-600/10 dark:border-violet-500/15 dark:bg-zinc-950/40 dark:hover:bg-violet-500/10"
          aria-label="Change theme"
        >
          {icon}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="rounded-2xl border-violet-200/60 bg-white/80 backdrop-blur-[10px] dark:border-violet-500/15 dark:bg-zinc-950/60"
      >
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
