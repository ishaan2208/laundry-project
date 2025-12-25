"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
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

import { Card, CardContent } from "@/components/ui/card";
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
  const reduceMotion = useReducedMotion();

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
    <LazyMotion features={domAnimation}>
      <div className="space-y-4">
        {/* Header */}
        <Card className="rounded-3xl border bg-background/40 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-background/50">
                  <Truck className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">
                    Laundry vendors
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activeCount} active • {initial.length} total
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-2xl border bg-background/50 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4" />
                <div className="min-w-0">
                  Adding a vendor auto-creates vendor locations for all active
                  properties.
                </div>
              </div>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button className="h-11 rounded-2xl gap-2" onClick={startAdd}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </SheetTrigger>

              {/* Premium sheet: padding + scroll + fixed footer */}
              <SheetContent
                side="bottom"
                className="h-[92vh] max-h-[92vh] p-0 rounded-t-3xl flex flex-col"
              >
                <div className="px-4 pt-4">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      {editing ? "Edit Vendor" : "Add Vendor"}
                    </SheetTitle>
                  </SheetHeader>

                  {editing ? (
                    <div className="mt-3 rounded-2xl border bg-background/50 p-3">
                      <div className="text-xs text-muted-foreground">
                        Editing
                      </div>
                      <div className="mt-1 text-sm font-semibold truncate">
                        {editing.name}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Name
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ABC Laundry"
                        className="h-12 rounded-2xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone (optional)
                      </Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="98765..."
                        className="h-12 rounded-2xl"
                        inputMode="tel"
                      />
                    </div>

                    <div className="rounded-2xl border bg-background/50 p-3 text-xs text-muted-foreground">
                      Tip: Save a phone number for faster follow-ups and vendor
                      reminders.
                    </div>
                  </div>
                </div>

                <div className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 flex-1 rounded-2xl"
                      onClick={() => setOpen(false)}
                      disabled={pending}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="h-12 flex-1 rounded-2xl gap-2"
                      disabled={pending || name.trim().length < 2}
                      onClick={() => startTransition(save)}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </Card>

        {/* List */}
        <div className="space-y-2">
          {initial.map((v) => (
            <m.div
              key={v.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.16,
                ease: "easeOut",
              }}
            >
              <Card className="rounded-3xl border bg-background/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold">
                        {v.name}
                      </div>

                      {v.isActive ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full gap-1"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="rounded-full gap-1"
                        >
                          <BadgeX className="h-3.5 w-3.5" />
                          Disabled
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {v.phone ? v.phone : "No phone"}
                    </div>

                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-10 rounded-2xl gap-2"
                        onClick={() => startEdit(v)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-muted-foreground">
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
                </CardContent>
              </Card>
            </m.div>
          ))}
        </div>
      </div>
    </LazyMotion>
  );
}
