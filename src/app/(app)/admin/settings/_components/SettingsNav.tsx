"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import {
  UsersRound,
  Building2,
  Truck,
  Package,
  MapPin,
  ArrowRight,
} from "lucide-react";

const tabs = [
  { href: "/admin/settings/users", label: "Users", icon: UsersRound },
  { href: "/admin/settings/properties", label: "Properties", icon: Building2 },
  { href: "/admin/settings/vendors", label: "Vendors", icon: Truck },
  { href: "/admin/settings/items", label: "Items", icon: Package },
  { href: "/admin/settings/locations", label: "Locations", icon: MapPin },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app" || pathname === "/app/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SettingsNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <ScrollArea className="w-full p-1">
        <div className="flex gap-2 pb-1">
          {tabs.map((t) => {
            const active = isActivePath(pathname, t.href);
            const Icon = t.icon;

            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "group relative inline-flex items-center gap-2 whitespace-nowrap p-1 rounded-full px-3 py-2 text-sm",
                  "border transition",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/40",
                  active
                    ? "border-violet-500/30 bg-violet-600/10 text-foreground"
                    : "border-white/15 bg-background/40 text-muted-foreground hover:text-foreground hover:bg-violet-600/5 dark:border-white/10"
                )}
              >
                {/* active glow */}
                {active ? (
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-0 -z-10 rounded-full",
                      "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10",
                      "ring-1 ring-violet-500/20"
                    )}
                  />
                ) : null}

                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full border",
                    active
                      ? "border-violet-500/20 bg-background/50"
                      : "border-white/15 bg-background/30 group-hover:bg-background/40 dark:border-white/10"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4", active ? "text-violet-500" : "")}
                  />
                </span>

                <span className="font-medium">{t.label}</span>

                {/* subtle hint arrow when active */}
                <m.span
                  initial={false}
                  animate={
                    active && !reduceMotion
                      ? { x: [0, 2, 0], opacity: 1 }
                      : { x: 0, opacity: 0 }
                  }
                  transition={{ duration: 0.8, repeat: active ? Infinity : 0 }}
                  className="ml-1 hidden sm:inline-flex"
                >
                  <ArrowRight className="h-4 w-4 text-violet-500/80" />
                </m.span>
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </LazyMotion>
  );
}
