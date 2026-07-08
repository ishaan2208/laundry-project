"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Check, ChevronDown } from "lucide-react";

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

/** URL-param hotel picker used by report pages. */
export default function PropertySelector({
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
          className={cn(
            "surface press flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          )}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Building2 className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-muted-foreground">
              Hotel
            </span>
            <span
              className={cn(
                "block truncate text-base font-semibold",
                !selected && "font-medium text-muted-foreground"
              )}
            >
              {selected ? selected.name : "Choose hotel"}
            </span>
          </span>
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        </button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>My hotel</DrawerTitle>
          <DrawerDescription>
            Numbers on this page are for one hotel at a time.
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
