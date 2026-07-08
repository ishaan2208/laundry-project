"use client";

import * as React from "react";
import { Check, ChevronDown, Building2, Truck } from "lucide-react";
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

export type SelectOption = { value: string; label: string; subtitle?: string };

type LeadingIcon = "building" | "truck";

const LeadingIconMap: Record<
  LeadingIcon,
  React.ComponentType<{ className?: string }>
> = {
  building: Building2,
  truck: Truck,
};

export function BottomSheetSelect(props: {
  label: string;
  value?: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** One plain-language line shown inside the sheet, e.g. "Which laundry is picking up?" */
  hint?: string;
  disabled?: boolean;
  leadingIcon?: LeadingIcon;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = props.options.find((o) => o.value === props.value);
  const Icon = props.leadingIcon ? LeadingIconMap[props.leadingIcon] : null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          disabled={props.disabled}
          className={cn(
            "surface press flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left",
            "disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          )}
        >
          {Icon ? (
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </span>
          ) : null}

          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-muted-foreground">
              {props.label}
            </span>
            <span
              className={cn(
                "block truncate text-base font-semibold",
                !selected && "font-medium text-muted-foreground"
              )}
            >
              {selected?.label ?? props.placeholder ?? "Tap to choose"}
            </span>
          </span>

          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        </button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{props.label}</DrawerTitle>
          {props.hint ? (
            <DrawerDescription>{props.hint}</DrawerDescription>
          ) : null}
        </DrawerHeader>

        <DrawerBody className="px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {props.options.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nothing to choose yet. Ask your admin to set this up.
            </p>
          ) : (
            <div role="listbox" aria-label={props.label} className="space-y-1">
              {props.options.map((o) => {
                const active = o.value === props.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      props.onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "press flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left",
                      active ? "bg-accent" : "hover:bg-muted"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold">
                        {o.label}
                      </span>
                      {o.subtitle ? (
                        <span className="block truncate text-sm text-muted-foreground">
                          {o.subtitle}
                        </span>
                      ) : null}
                    </span>
                    {active ? (
                      <Check className="size-5 shrink-0 text-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
