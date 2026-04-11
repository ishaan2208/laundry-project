// src/components/mobile/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Truck,
  PackageCheck,
  ClipboardList,
  Layers,
  ScrollText,
} from "lucide-react";

const items = [
  { href: "/app/dispatch", label: "Dispatch", icon: Truck },
  { href: "/app/receive", label: "Receive", icon: PackageCheck },
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/stock", label: "Stock", icon: Layers },
  { href: "/app/vendor-ledger", label: "Ledger", icon: ScrollText },
  { href: "/app/txns", label: "Log", icon: ClipboardList },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <>
      {/* Spacer so page content isn't covered by the fixed bottom nav. Matches nav height + safe-area inset. */}
      <div
        style={{ height: "calc(64px + env(safe-area-inset-bottom))" }}
        aria-hidden
      />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="mx-auto max-w-lg grid grid-cols-6 px-1"
          style={{ height: 64 }}
        >
          {items.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/app"
                ? path === "/app" || path === "/app/"
                : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] leading-tight sm:text-xs",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-105")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
