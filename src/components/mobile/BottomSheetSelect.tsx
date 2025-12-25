"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Building2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  disabled?: boolean;
  leadingIcon?: LeadingIcon;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = props.options.find((o) => o.value === props.value);

  const Icon = props.leadingIcon ? LeadingIconMap[props.leadingIcon] : null;

  return (
    <div className="space-y-2">
      <div className="px-1 text-xs font-semibold text-muted-foreground">
        {props.label}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-14 w-full justify-between rounded-3xl px-4 text-base",
              "border-violet-200/70 bg-white/60 backdrop-blur-[2px] shadow-sm",
              "dark:border-violet-500/15 dark:bg-zinc-950/40",
              "focus-visible:ring-2 focus-visible:ring-violet-500/40",
              !selected && "text-muted-foreground"
            )}
            disabled={props.disabled}
          >
            <span className="flex min-w-0 items-center gap-3">
              {Icon ? (
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  <Icon className="h-5 w-5" />
                </span>
              ) : null}

              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">
                  {selected?.label ?? props.placeholder ?? "Select"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {selected?.subtitle ?? "Tap to choose"}
                </span>
              </span>
            </span>

            <ChevronsUpDown className="h-5 w-5 opacity-70" />
          </Button>
        </SheetTrigger>

        {/* Keyboard-less sheet: NO CommandInput / NO text fields */}
        <SheetContent
          side="bottom"
          className={cn(
            "h-[88vh] rounded-t-3xl p-0",
            "border-violet-200/60 bg-background/80 backdrop-blur-[2px]",
            "dark:border-violet-500/15"
          )}
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle className="text-base">{props.label}</SheetTitle>
            </SheetHeader>

            <div className="px-4 pb-3 pt-2 text-sm text-muted-foreground">
              Tap one option. (No search to keep it thumb-only.)
            </div>

            <Separator className="opacity-60" />

            <ScrollArea className="flex-1">
              <div className="p-2">
                {props.options.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No options available.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {props.options.map((o) => {
                      const active = o.value === props.value;
                      return (
                        <Button
                          key={o.value}
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            props.onChange(o.value);
                            setOpen(false);
                          }}
                          className={cn(
                            "h-auto w-full justify-between rounded-2xl px-3 py-3 text-left",
                            "hover:bg-violet-600/10 dark:hover:bg-violet-500/10",
                            active &&
                              "bg-violet-600/10 text-foreground dark:bg-violet-500/10"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold">
                              {o.label}
                            </div>
                            {o.subtitle ? (
                              <div className="truncate text-sm text-muted-foreground">
                                {o.subtitle}
                              </div>
                            ) : null}
                          </div>
                          <div className="ml-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-transparent">
                            {active ? (
                              <Check className="h-5 w-5 text-violet-700 dark:text-violet-200" />
                            ) : null}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-violet-200/60 bg-background/70 p-3 backdrop-blur-[2px] dark:border-violet-500/15">
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  "h-12 w-full rounded-2xl text-base",
                  "border border-violet-200/60 bg-white/60 backdrop-blur-[2px] shadow-sm",
                  "dark:border-violet-500/15 dark:bg-zinc-950/40"
                )}
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
