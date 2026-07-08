"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Pencil,
  BadgeCheck,
  BadgeX,
  Hash,
  Save,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { upsertLinenItem } from "@/actions/masters/upsertLinenItem";
import { toggleLinenItemActive } from "@/actions/masters/toggleLinenItemActive";

type Row = { id: string; name: string; sku: string | null; isActive: boolean };

export default function ItemsClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const editing = useMemo(
    () => initial.find((x) => x.id === editId) ?? null,
    [editId, initial]
  );

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");

  function startAdd() {
    setEditId(null);
    setName("");
    setSku("");
    setOpen(true);
  }

  function startEdit(row: Row) {
    setEditId(row.id);
    setName(row.name);
    setSku(row.sku ?? "");
    setOpen(true);
  }

  async function save() {
    const res = await upsertLinenItem({ id: editId ?? undefined, name, sku });
    if (res?.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  const activeCount = initial.filter((x) => x.isActive).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="surface rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Package className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">
                  Linen items
                </div>
                <div className="text-sm text-muted-foreground">
                  {activeCount} active · {initial.length} total
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                Keep item names consistent across properties (helps reports &
                vendor billing).
              </div>
            </div>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="lg" onClick={startAdd}>
                <Plus className="size-4" />
                Add
              </Button>
            </SheetTrigger>

            {/* Premium sheet: padding + scroll + fixed footer */}
            <SheetContent
              side="bottom"
              className="h-[92vh] max-h-[92vh] flex-col rounded-t-3xl p-0"
            >
              <div className="px-4 pt-4">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Package className="size-5" />
                    {editing ? "Edit item" : "Add item"}
                  </SheetTitle>
                </SheetHeader>

                {editing ? (
                  <div className="mt-3 rounded-xl bg-muted p-3">
                    <div className="text-sm text-muted-foreground">
                      Editing
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold">
                      {editing.name}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="size-4" />
                      Name
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Bath towel, Bed sheet..."
                      className="h-12 rounded-xl text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="size-4" />
                      SKU (optional)
                    </Label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="BT-001"
                      className="h-12 rounded-xl text-base"
                    />
                  </div>

                  <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                    Tip: SKU is useful for procurement & vendor bills.
                  </div>
                </div>
              </div>

              <div className="border-t bg-card px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    disabled={pending || name.trim().length < 2}
                    onClick={() => startTransition(save)}
                  >
                    <Save className="size-4" />
                    Save
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {initial.map((x) => (
          <div key={x.id} className="surface rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold">
                    {x.name}
                  </div>

                  {x.isActive ? (
                    <Badge variant="secondary" className="gap-1">
                      <BadgeCheck className="size-3.5" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <BadgeX className="size-3.5" />
                      Disabled
                    </Badge>
                  )}
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  {x.sku ? `SKU: ${x.sku}` : "No SKU"}
                </div>

                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(x)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-muted-foreground">
                  {x.isActive ? "Enabled" : "Disabled"}
                </div>
                <Switch
                  checked={x.isActive}
                  onCheckedChange={(next) =>
                    startTransition(async () => {
                      await toggleLinenItemActive({
                        id: x.id,
                        isActive: next,
                      });
                      router.refresh();
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
