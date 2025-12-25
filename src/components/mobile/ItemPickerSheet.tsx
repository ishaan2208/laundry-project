"use client";

import * as React from "react";
import { Plus, Check, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export type PickerItem = { id: string; name: string; subtitle?: string };

export function ItemPickerSheet(props: {
  title?: string;
  items: PickerItem[];
  quickItems?: PickerItem[];
  selectedIds: Set<string>;
  onAdd: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const quick = React.useMemo(() => {
    const q = props.quickItems ?? [];
    // Remove already-selected from quick chips
    return q.filter((it) => !props.selectedIds.has(it.id)).slice(0, 10);
  }, [props.quickItems, props.selectedIds]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={cn(
            "h-14 w-full rounded-3xl px-4 text-base font-semibold",
            "border border-violet-200/60 bg-white/60 backdrop-blur-[2px] shadow-sm",
            "dark:border-violet-500/15 dark:bg-zinc-950/40",
            "hover:bg-violet-600/10 dark:hover:bg-violet-500/10"
          )}
          disabled={props.disabled}
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Items
        </Button>
      </SheetTrigger>

      {/* Keyboard-less sheet: NO search input */}
      <SheetContent
        side="bottom"
        className={cn(
          "h-[90vh] rounded-t-3xl p-0",
          "border-violet-200/60 bg-background/80 backdrop-blur-[2px]",
          "dark:border-violet-500/15"
        )}
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle className="text-base">
              {props.title ?? "Add items"}
            </SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-3 pt-2 text-sm text-muted-foreground">
            Tap to add. Sheet stays open so you can add multiple items fast.
          </div>

          <Separator className="opacity-60" />

          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {/* Quick add chips */}
              {quick.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Quick add
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quick.map((it) => (
                      <Button
                        key={it.id}
                        type="button"
                        variant="secondary"
                        className={cn(
                          "h-11 rounded-2xl px-3 text-sm font-semibold",
                          "border border-violet-200/60 bg-white/60 backdrop-blur-[2px]",
                          "dark:border-violet-500/15 dark:bg-zinc-950/40",
                          "hover:bg-violet-600/10 dark:hover:bg-violet-500/10"
                        )}
                        onClick={() => props.onAdd(it.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="max-w-[14rem] truncate">
                          {it.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Full list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-muted-foreground">
                    All items
                  </div>
                  <Badge
                    variant="secondary"
                    className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                  >
                    {props.items.length}
                  </Badge>
                </div>

                {props.items.length === 0 ? (
                  <div className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm text-muted-foreground backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-2xl bg-violet-600/10 p-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                        <PackageSearch className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          No items found
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Add linen items from admin settings.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {props.items.map((it) => {
                      const added = props.selectedIds.has(it.id);
                      return (
                        <Button
                          key={it.id}
                          type="button"
                          variant="ghost"
                          disabled={added}
                          onClick={() => {
                            if (added) return;
                            props.onAdd(it.id);
                          }}
                          className={cn(
                            "h-auto w-full justify-between rounded-2xl px-3 py-3 text-left",
                            "hover:bg-violet-600/10 dark:hover:bg-violet-500/10",
                            added && "opacity-60"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold">
                              {it.name}
                            </div>
                            {it.subtitle ? (
                              <div className="truncate text-sm text-muted-foreground">
                                {it.subtitle}
                              </div>
                            ) : null}
                          </div>

                          <div className="ml-3 flex items-center gap-2">
                            {added ? (
                              <Badge className="rounded-2xl bg-violet-600 text-white dark:bg-violet-500">
                                Added
                              </Badge>
                            ) : null}
                            <div className="grid h-10 w-10 place-items-center rounded-2xl">
                              {added ? (
                                <Check className="h-5 w-5 text-violet-700 dark:text-violet-200" />
                              ) : (
                                <Plus className="h-5 w-5 opacity-70" />
                              )}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="border-t border-violet-200/60 bg-background/70 p-3 backdrop-blur-[2px] dark:border-violet-500/15">
            <Button
              type="button"
              className="h-12 w-full rounded-2xl bg-violet-600 text-base font-semibold text-white hover:bg-violet-600/90 dark:bg-violet-500 dark:hover:bg-violet-500/90"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
