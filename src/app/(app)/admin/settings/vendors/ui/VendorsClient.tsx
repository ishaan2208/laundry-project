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
import { upsertVendor } from "@/actions/masters/upsertVendor";
import { toggleVendorActive } from "@/actions/masters/toggleVendorActive";

type Row = {
  id: string;
  name: string;
  phone: string | null;
  isActive: boolean;
};

export default function VendorsClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const editing = useMemo(
    () => initial.find((v) => v.id === editId) ?? null,
    [editId, initial]
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function startAdd() {
    setEditId(null);
    setName("");
    setPhone("");
    setOpen(true);
  }

  function startEdit(row: Row) {
    setEditId(row.id);
    setName(row.name);
    setPhone(row.phone ?? "");
    setOpen(true);
  }

  async function save() {
    const res = await upsertVendor({ id: editId ?? undefined, name, phone });
    if (res?.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Laundry vendors</div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button onClick={startAdd}>Add</Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{editing ? "Edit Vendor" : "Add Vendor"}</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ABC Laundry"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Phone (optional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765..."
                />
              </div>

              <Button
                className="w-full"
                disabled={pending || name.trim().length < 2}
                onClick={() => startTransition(save)}
              >
                Save
              </Button>

              <div className="text-xs text-muted-foreground">
                Creating a vendor auto-creates vendor locations for all active
                properties.
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-2">
        {initial.map((v) => (
          <Card key={v.id} className="rounded-2xl">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-medium">{v.name}</div>
                <div className="text-xs text-muted-foreground">
                  {v.phone ? v.phone : "No phone"}
                </div>

                <div className="mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(v)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-muted-foreground">
                  {v.isActive ? "Active" : "Disabled"}
                </div>
                <Switch
                  checked={v.isActive}
                  onCheckedChange={(next) =>
                    startTransition(async () => {
                      await toggleVendorActive({ id: v.id, isActive: next });
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
