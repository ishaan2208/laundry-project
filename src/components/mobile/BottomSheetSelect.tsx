"use client";

import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; subtitle?: string };

export function BottomSheetSelect(props: {
  label: string;
  value?: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = props.options.find((o) => o.value === props.value);

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        {props.label}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full justify-between rounded-2xl"
            disabled={props.disabled}
          >
            <span
              className={cn("truncate", !selected && "text-muted-foreground")}
            >
              {selected?.label ?? props.placeholder ?? "Select"}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-70" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{props.label}</SheetTitle>
          </SheetHeader>
          <div className="mt-3">
            <Command>
              <CommandInput placeholder="Search..." />
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {props.options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    onSelect={() => {
                      props.onChange(o.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate">{o.label}</div>
                      {o.subtitle && (
                        <div className="truncate text-xs text-muted-foreground">
                          {o.subtitle}
                        </div>
                      )}
                    </div>
                    {o.value === props.value && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
