"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Building2 } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useProperty } from "@/components/PropertyProvider";

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
  const { selectProperty } = useProperty();

  const selected = properties.find((p) => p.id === selectedPropertyId);

  function setProperty(id: string) {
    // Every other screen follows the same choice.
    selectProperty(id);
    const next = new URLSearchParams(sp.toString());
    next.set("propertyId", id);
    router.replace(`${pathname}?${next.toString()}`);
    setOpen(false);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="Change hotel"
          className="press -mx-1 flex min-w-0 items-center gap-1.5 rounded-lg px-1 text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="truncate text-xl font-bold tracking-tight">
            {selected ? selected.name : "Choose hotel"}
          </span>
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        </button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>My hotel</DrawerTitle>
          <DrawerDescription>
            Everything you see is for this hotel.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div role="listbox" aria-label="Hotels" className="space-y-1">
            {properties.map((p) => {
              const active = p.id === selectedPropertyId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setProperty(p.id)}
                  className={cn(
                    "press flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                    active ? "bg-accent" : "hover:bg-muted"
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                    <Building2 className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-base font-semibold">
                    {p.name}
                  </span>
                  {active ? (
                    <Check className="size-5 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
