"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Plus,
  Pencil,
  Phone,
  BadgeCheck,
  BadgeX,
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

  const activeCount = initial.filter((x) => x.isActive).length;

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
    <div className="space-y-4">
      {/* Header */}
      <div className="surface rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Truck className="size-5" />
              </span>

              <div className="min-w-0">
                <div className="truncate text-base font-semibold">
                  Laundry vendors
                </div>
                <div className="text-sm text-muted-foreground">
                  {activeCount} active · {initial.length} total
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                Adding a vendor auto-creates vendor locations for all active
                properties.
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
                    <Truck className="size-5" />
                    {editing ? "Edit laundry vendor" : "Add laundry vendor"}
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
                      <Truck className="size-4" />
                      Name
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ABC Laundry"
                      className="h-12 rounded-xl text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="size-4" />
                      Phone (optional)
                    </Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765..."
                      className="h-12 rounded-xl text-base"
                      inputMode="tel"
                    />
                  </div>

                  <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                    Tip: Save a phone number for faster follow-ups and vendor
                    reminders.
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
        {initial.map((v) => (
          <div key={v.id} className="surface rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold">
                    {v.name}
                  </div>

                  {v.isActive ? (
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
                  {v.phone ? v.phone : "No phone"}
                </div>

                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(v)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-muted-foreground">
                  {v.isActive ? "Enabled" : "Disabled"}
                </div>
                <Switch
                  checked={v.isActive}
                  onCheckedChange={(next) =>
                    startTransition(async () => {
                      await toggleVendorActive({
                        id: v.id,
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
