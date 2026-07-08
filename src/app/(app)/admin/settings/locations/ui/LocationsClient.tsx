"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin,
  Building2,
  Pencil,
  Shield,
  BadgeCheck,
  BadgeX,
  Save,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import PropertySelectorClient from "@/app/(app)/admin/settings/locations/PropertySelectorClient";

import { upsertLocationName } from "@/actions/masters/upsertLocationName";
import { toggleLocationActive } from "@/actions/masters/toggleLocationActive";

type PropertyRow = { id: string; name: string };
type LocationRow = {
  id: string;
  name: string;
  kind: string;
  isActive: boolean;
  isSystem: boolean;
  vendor: { name: string } | null;
};

/** Plain hotel words for the system location kinds — never show the raw enum. */
const KIND_LABELS: Record<string, string> = {
  CLEAN_STORE: "Ready to use",
  SOILED_STORE: "To be washed",
  VENDOR: "At the laundry",
  REWASH_BIN: "Wash again",
  DAMAGED_BIN: "Damaged",
  DISCARDED_LOST: "Thrown away / lost",
};

function kindLabel(kind: string) {
  return KIND_LABELS[kind] ?? kind.replaceAll("_", " ").toLowerCase();
}

export default function LocationsClient({
  properties,
  propertyId,
  initial,
}: {
  properties: PropertyRow[];
  propertyId: string | null;
  initial: LocationRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<LocationRow | null>(null);
  const [name, setName] = useState("");

  const activeCount = initial.filter((l) => l.isActive).length;

  function openEdit(row: LocationRow) {
    setEdit(row);
    setName(row.name);
    setOpen(true);
  }

  async function save() {
    if (!edit) return;
    const res = await upsertLocationName({ id: edit.id, name });
    if (res?.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="surface rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <MapPin className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">
                  Locations
                </div>
                <div className="text-sm text-muted-foreground">
                  {activeCount} active · {initial.length} total
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                These names can&rsquo;t change kind — that stays ledger-safe.
                Disabling is blocked if stock remains.
              </div>
            </div>
          </div>

          <div className="w-[210px] max-w-[55vw]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="size-4" />
              Property
            </div>
            <div className="mt-2">
              <PropertySelectorClient
                properties={properties}
                selectedPropertyId={propertyId}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {initial.map((loc) => (
          <div key={loc.id} className="surface rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-sm font-semibold">
                    {loc.name}
                  </div>

                  <Badge variant="secondary">
                    {loc.kind === "VENDOR" && loc.vendor?.name
                      ? `${loc.vendor.name}`
                      : kindLabel(loc.kind)}
                  </Badge>

                  {loc.isSystem ? (
                    <Badge variant="outline" className="gap-1">
                      <Shield className="size-3.5" />
                      System
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(loc)}
                  >
                    <Pencil className="size-4" />
                    Rename
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {loc.isActive ? (
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

                <Switch
                  checked={loc.isActive}
                  onCheckedChange={(next) =>
                    startTransition(async () => {
                      const res = await toggleLocationActive({
                        id: loc.id,
                        isActive: next,
                      });
                      if (res?.ok === false)
                        toast.error(res.message ?? "Blocked");
                      router.refresh();
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] max-h-[92vh] flex-col rounded-t-3xl p-0"
        >
          <div className="px-4 pt-4">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Pencil className="size-5" />
                Rename location
              </SheetTitle>
            </SheetHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-muted p-3">
                <div className="text-sm text-muted-foreground">Kind</div>
                <div className="mt-1 text-sm font-semibold">
                  {edit ? kindLabel(edit.kind) : "-"}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Disabling is blocked if any stock remains in the location.
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
  );
}
