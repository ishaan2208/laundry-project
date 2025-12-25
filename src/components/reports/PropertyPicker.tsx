"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Check,
  ChevronDown,
  MapPin,
  Users,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export type PropertyLite = { id: string; name: string };

export default function PropertySelector({
  properties,
  selectedPropertyId,
}: {
  properties: PropertyLite[];
  selectedPropertyId?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const selected = properties.find((p) => p.id === selectedPropertyId);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return properties;
    return properties.filter((p) => p.name.toLowerCase().includes(needle));
  }, [properties, q]);

  function setProperty(id: string) {
    const next = new URLSearchParams(sp.toString());
    next.set("propertyId", id);
    router.replace(`${pathname}?${next.toString()}`);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 rounded-2xl justify-between gap-2",
            "border-white/15 bg-white/55 backdrop-blur-md",
            "dark:border-white/10 dark:bg-white/5",
            "hover:bg-white/70 dark:hover:bg-white/10"
          )}
          aria-label="Select property"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-violet-500 dark:text-violet-300" />
            <span className="max-w-[140px] truncate text-sm">
              {selected ? selected.name : "Select property"}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="p-0">
        <div className="p-4">
          <SheetHeader>
            <SheetTitle className="text-base">My property</SheetTitle>
          </SheetHeader>
          <div className="mt-3">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search property…"
              className="h-11 rounded-2xl"
            />
          </div>
        </div>

        <Separator />

        <ScrollArea className="max-h-[55vh]">
          {/* add extra bottom padding so the footer/Close button doesn't overlap list items */}
          <div className="p-3 pb-40">
            <div className="space-y-2">
              {filtered.map((p) => {
                const active = p.id === selectedPropertyId;

                return (
                  <button
                    key={p.id}
                    onClick={() => setProperty(p.id)}
                    className={cn(
                      "w-full text-left rounded-2xl px-3 py-3 transition",
                      "hover:bg-accent/50 active:scale-[0.99]",
                      "focus:outline-none focus:ring-2 focus:ring-violet-500/40",
                      active
                        ? "bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-white/15 dark:border-white/10"
                        : "border border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold truncate">
                            {p.name}
                          </div>
                          {/* small repeating icon cluster */}
                          <div className="hidden sm:flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground/80" />
                            <Users className="h-3 w-3 text-muted-foreground/80" />
                            <Tag className="h-3 w-3 text-muted-foreground/80" />
                          </div>
                        </div>

                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Tap to load dashboard
                        </div>
                      </div>

                      {active ? (
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/50 dark:bg-white/5 border border-white/15 dark:border-white/10">
                          <Check className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                        </div>
                      ) : (
                        <div className="h-9 w-9" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <GlassCard className="mt-3 p-4">
                <div className="text-sm font-semibold">No results</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Try a different name.
                </div>
              </GlassCard>
            ) : null}
          </div>
        </ScrollArea>

        <div className="p-4 pt-2">
          <Button
            variant="secondary"
            className="w-full h-11 rounded-2xl"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
