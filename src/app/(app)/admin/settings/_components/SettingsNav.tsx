"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  UsersRound,
  Building2,
  Truck,
  Package,
  MapPin,
  IndianRupee,
  ClipboardCheck,
} from "lucide-react";

const tabs = [
  { href: "/admin/settings/users", label: "Users", icon: UsersRound },
  { href: "/admin/settings/properties", label: "Properties", icon: Building2 },
  { href: "/admin/settings/vendors", label: "Vendors", icon: Truck },
  { href: "/admin/settings/items", label: "Items", icon: Package },
  { href: "/admin/settings/locations", label: "Locations", icon: MapPin },
  { href: "/admin/settings/pricing", label: "Pricing", icon: IndianRupee },
  {
    href: "/admin/physical-stock-counts",
    label: "Counts",
    icon: ClipboardCheck,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app" || pathname === "/app/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <ScrollArea className="w-full p-1">
      <div className="flex gap-2 pb-1">
        {tabs.map((t) => {
          const active = isActivePath(pathname, t.href);
          const Icon = t.icon;

          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "true" : undefined}
              className={cn(
                "press inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-sm font-semibold",
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
