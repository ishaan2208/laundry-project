"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProperty } from "@/components/PropertyProvider";
import { Home, Layers, BookOpen, Settings2 } from "lucide-react";

const tabs = [
  { href: "/app", label: "Home", icon: Home, exact: true },
  { href: "/app/stock", label: "Linen", icon: Layers, exact: false },
  { href: "/app/txns", label: "Register", icon: BookOpen, exact: false },
];

/**
 * Focused task flows hide the tab bar so staff finish one job at a time.
 * Every route that renders StickyBar (a fixed bottom action bar) MUST be
 * listed here — otherwise the tab bar sits on top of it (BottomNav has a
 * higher stacking layer than StickyBar) and the primary button becomes
 * invisible.
 */
const immersiveRoutes = [
  "/app/dispatch",
  "/app/receive",
  "/app/stock/physical-count",
  "/admin/procurement",
  "/admin/discard",
  "/admin/closing",
];

export default function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  const path = usePathname();

  // Tabs carry the app-wide hotel so multi-hotel users keep their context.
  const { propertyId } = useProperty();

  if (immersiveRoutes.some((r) => path.startsWith(r))) return null;

  const items = isAdmin
    ? [...tabs, { href: "/admin", label: "Admin", icon: Settings2, exact: false }]
    : tabs;

  const hrefFor = (base: string) =>
    base === "/app" || base === "/admin" || !propertyId
      ? base
      : `${base}?propertyId=${encodeURIComponent(propertyId)}`;

  return (
    <>
      {/* Spacer so content never hides behind the fixed bar. */}
      <div
        style={{ height: "calc(68px + env(safe-area-inset-bottom))" }}
        aria-hidden
      />

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-(--z-nav) border-t bg-background pb-safe"
      >
        <div
          className="mx-auto grid max-w-md px-2"
          style={{
            height: 68,
            gridTemplateColumns: `repeat(${items.length}, 1fr)`,
          }}
        >
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? path === href || path === `${href}/`
              : path.startsWith(href);
            return (
              <Link
                key={href}
                href={hrefFor(href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press-soft flex flex-col items-center justify-center gap-1",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-14 place-items-center rounded-full transition-colors duration-200",
                    active && "bg-accent"
                  )}
                >
                  <Icon className="size-5.5" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    "text-xs leading-none",
                    active ? "font-bold" : "font-medium"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
