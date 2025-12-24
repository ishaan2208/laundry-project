"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Linen items</div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button onClick={startAdd}>Add</Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{editing ? "Edit Item" : "Add Item"}</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bath Towel, Bed Sheet..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>SKU (optional)</Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="BT-001"
                />
              </div>

              <Button
                className="w-full"
                disabled={pending || name.trim().length < 2}
                onClick={() => startTransition(save)}
              >
                Save
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-2">
        {initial.map((x) => (
          <Card key={x.id} className="rounded-2xl">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-medium">{x.name}</div>
                <div className="text-xs text-muted-foreground">
                  {x.sku ? `SKU: ${x.sku}` : "No SKU"}
                </div>

                <div className="mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(x)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-muted-foreground">
                  {x.isActive ? "Active" : "Disabled"}
                </div>
                <Switch
                  checked={x.isActive}
                  onCheckedChange={(next) =>
                    startTransition(async () => {
                      await toggleLinenItemActive({ id: x.id, isActive: next });
                      router.refresh();
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
