"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  PackageSearch,
  Timer,
  ReceiptText,
  ListChecks,
  LayoutGrid,
} from "lucide-react";

const REPORTS = [
  //   {
  //     href: "/admin/reports",
  //     title: "Overview",
  //     desc: "All reports",
  //     icon: LayoutGrid,
  //   },
  //   {
  //     href: "/admin/reports/stock",
  //     title: "Stock",
  //     desc: "Balances snapshot",
  //     icon: PackageSearch,
  //   },
  //   {
  //     href: "/admin/reports/vendor-pending",
  //     title: "Vendor Pending",
  //     desc: "At laundry / pending",
  //     icon: Timer,
  //   },
  {
    href: "/admin/reports/billing",
    title: "Monthly Cleaned",
    desc: "Vendor billing qty",
    icon: ReceiptText,
  },
  //   {
  //     href: "/admin/reports/txns",
  //     title: "Txns Log",
  //     desc: "Audit trail",
  //     icon: ListChecks,
  //   },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin/reports") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function ReportsNav() {
  const pathname = usePathname();

  const active = REPORTS.find((r) => isActive(pathname, r.href));

  return (
    <div className="flex items-center gap-2">
      {/* Horizontal thumb tabs */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-1">
          {REPORTS.map((r) => {
            const active = isActive(pathname, r.href);
            const Icon = r.icon;

            return (
              <Link
                key={r.href}
                href={r.href}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
                  "active:scale-[0.99]",
                  active
                    ? "border-violet-500/40 bg-violet-500/10 text-foreground"
                    : "bg-background hover:bg-muted/60"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap font-medium">{r.title}</span>
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* All reports sheet (one tap) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="h-10 shrink-0 gap-2 rounded-full"
          >
            <BarChart3 className="h-4 w-4" />
            {active ? active.title : "Reports"}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-3">
            <SheetTitle>All reports</SheetTitle>
          </SheetHeader>

          <div className="grid gap-2 pb-2">
            {REPORTS.map((r) => {
              const active = isActive(pathname, r.href);
              const Icon = r.icon;

              return (
                <Link
                  key={r.href}
                  href={r.href}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border p-3",
                    active
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border bg-background">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium leading-tight">{r.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {r.desc}
                      </div>
                    </div>
                  </div>
                  {active ? <Badge variant="secondary">Active</Badge> : null}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
