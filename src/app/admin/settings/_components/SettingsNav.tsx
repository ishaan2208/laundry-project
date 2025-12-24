"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const tabs = [
  { href: "/settings", label: "Home" },
  { href: "/settings/users", label: "Users" },
  { href: "/settings/properties", label: "Properties" },
  { href: "/settings/vendors", label: "Vendors" },
  { href: "/settings/items", label: "Items" },
  { href: "/settings/locations", label: "Locations" },
  // { href: "/settings/users", label: "Users" }, // optional
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
