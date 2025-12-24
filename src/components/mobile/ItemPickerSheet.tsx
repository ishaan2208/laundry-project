"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

export type PickerItem = { id: string; name: string; subtitle?: string };

export function ItemPickerSheet(props: {
  title?: string;
  items: PickerItem[];
  selectedIds: Set<string>;
  onAdd: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full rounded-2xl"
          disabled={props.disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Items
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{props.title ?? "Add items"}</SheetTitle>
        </SheetHeader>

        <div className="mt-3">
          <Command>
            <CommandInput placeholder="Search items..." />
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {props.items.map((it) => {
                const added = props.selectedIds.has(it.id);
                return (
                  <CommandItem
                    key={it.id}
                    value={it.name}
                    disabled={added}
                    onSelect={() => {
                      if (added) return;
                      props.onAdd(it.id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate">{it.name}</div>
                      {it.subtitle && (
                        <div className="truncate text-xs text-muted-foreground">
                          {it.subtitle}
                        </div>
                      )}
                    </div>
                    {!added && <Plus className="h-4 w-4 opacity-70" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </div>
      </SheetContent>
    </Sheet>
  );
}
