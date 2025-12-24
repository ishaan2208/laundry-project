"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Check } from "lucide-react";
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

export type PropertyLite = { id: string; name: string };

export function PropertySelector({
  properties,
  selectedPropertyId,
}: {
  properties: PropertyLite[];
  selectedPropertyId?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const selected = properties.find((p) => p.id === selectedPropertyId);

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
          className="justify-between gap-2"
          aria-label="Select property"
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="max-w-45 truncate">
              {selected ? selected.name : "Select property"}
            </span>
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="p-0">
        <div className="p-4">
          <SheetHeader>
            <SheetTitle className="text-base">My property</SheetTitle>
          </SheetHeader>
        </div>
        <Separator />
        <ScrollArea className="max-h-[55vh]">
          <div className="p-2">
            {properties.map((p) => {
              const active = p.id === selectedPropertyId;
              return (
                <button
                  key={p.id}
                  onClick={() => setProperty(p.id)}
                  className="w-full rounded-lg px-3 py-3 text-left hover:bg-accent active:scale-[0.99] transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{p.name}</div>
                    {active ? (
                      <Check className="h-4 w-4 text-muted-foreground" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-4 pt-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
