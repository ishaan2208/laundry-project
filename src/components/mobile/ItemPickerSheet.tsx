"use client";

import * as React from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export type PickerItem = { id: string; name: string; subtitle?: string };

/** Multi-add item picker. The sheet stays open so several items can be added fast. */
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
    return q.filter((it) => !props.selectedIds.has(it.id)).slice(0, 10);
  }, [props.quickItems, props.selectedIds]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="xl"
          className="w-full"
          disabled={props.disabled}
        >
          <Plus className="size-5" />
          Add items
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{props.title ?? "Add items"}</DrawerTitle>
          <DrawerDescription>
            Tap to add. The list stays open so you can add several.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-4 px-4">
          {quick.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-bold text-muted-foreground">
                Often used
              </div>
              <div className="flex flex-wrap gap-2">
                {quick.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => props.onAdd(it.id)}
                    className="press inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-card px-3.5 text-sm font-semibold"
                  >
                    <Plus className="size-4" />
                    <span className="max-w-[14rem] truncate">{it.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="text-sm font-bold text-muted-foreground">
              All items ({props.items.length})
            </div>

            {props.items.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No items yet. Add linen items in admin settings first.
              </p>
            ) : (
              <div className="space-y-1">
                {props.items.map((it) => {
                  const added = props.selectedIds.has(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      disabled={added}
                      onClick={() => {
                        if (!added) props.onAdd(it.id);
                      }}
                      className={cn(
                        "press flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left",
                        added ? "opacity-55" : "hover:bg-muted"
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold">
                          {it.name}
                        </span>
                        {it.subtitle ? (
                          <span className="block truncate text-sm text-muted-foreground">
                            {it.subtitle}
                          </span>
                        ) : null}
                      </span>
                      {added ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-clean">
                          <Check className="size-4" />
                          Added
                        </span>
                      ) : (
                        <Plus className="size-5 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button size="lg" className="w-full" onClick={() => setOpen(false)}>
            Done adding
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
