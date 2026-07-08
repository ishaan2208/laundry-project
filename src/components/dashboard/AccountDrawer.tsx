"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { CircleUserRound, LogOut, Moon, Sun, Laptop } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Laptop },
] as const;

export function AccountDrawer({ isAdmin }: { isAdmin: boolean }) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="My account"
          className="press grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <CircleUserRound className="size-6" />
        </button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>My account</DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="space-y-5 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
              <CircleUserRound className="size-7" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">
                {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Signed in"}
              </div>
              <div className="text-sm text-muted-foreground">
                {isAdmin ? "Admin" : "Housekeeping"}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              Screen colours
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
              {themeOptions.map((o) => {
                const active = mounted && theme === o.value;
                const Icon = o.icon;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setTheme(o.value)}
                    className={cn(
                      "press flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold",
                      active
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <SignOutButton redirectUrl="/sign-in">
            <Button variant="secondary" size="lg" className="w-full">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </SignOutButton>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
