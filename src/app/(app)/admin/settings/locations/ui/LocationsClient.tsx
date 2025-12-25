"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
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

import { Card, CardContent } from "@/components/ui/card";
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

function human(v: string) {
  return v.replaceAll("_", " ");
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
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<LocationRow | null>(null);
  const [name, setName] = useState("");

  const title = useMemo(
    () =>
      properties.find((p) => p.id === propertyId)?.name ?? "Select property",
    [properties, propertyId]
  );

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

  const activeCount = initial.filter((l) => l.isActive).length;

  return (
    <LazyMotion features={domAnimation}>
      <div className="space-y-4">
        <Card className="rounded-3xl border bg-background/40 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-background/50">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">
                    Locations
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activeCount} active • {initial.length} total
                  </div>
                </div>
              </div>

              {/* <div className="mt-3 flex items-start gap-2 rounded-2xl border bg-background/50 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4" />
                <div className="min-w-0">
                  Kind is immutable (ledger-safe). Disabling is blocked if stock
                  remains.
                </div>
              </div> */}
            </div>

            <div className="w-[210px] max-w-[55vw]">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Property
              </div>
              <div className=" mt-2">
                <PropertySelectorClient
                  properties={properties}
                  selectedPropertyId={propertyId}
                />
              </div>
              {/* <div className="mt-2 text-xs text-muted-foreground truncate">
                Showing: <span className="font-medium">{title}</span>
              </div> */}
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          {initial.map((loc) => (
            <m.div
              key={loc.id}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold">
                        {loc.name}
                      </div>

                      <Badge variant="secondary" className="rounded-full">
                        {loc.kind === "VENDOR" && loc.vendor?.name
                          ? `Vendor • ${loc.vendor.name}`
                          : human(loc.kind)}
                      </Badge>

                      {loc.isSystem ? (
                        <Badge variant="outline" className="rounded-full gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          System
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-10 rounded-2xl gap-2"
                        onClick={() => openEdit(loc)}
                      >
                        <Pencil className="h-4 w-4" />
                        Rename
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {loc.isActive ? (
                      <Badge variant="secondary" className="rounded-full gap-1">
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

                    <Switch
                      checked={loc.isActive}
                      onCheckedChange={(next) =>
                        startTransition(async () => {
                          const res = await toggleLocationActive({
                            id: loc.id,
                            isActive: next,
                          });
                          if (res?.ok === false)
                            alert(res.message ?? "Blocked");
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

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="h-[92vh] max-h-[92vh] p-0 rounded-t-3xl flex flex-col"
          >
            <div className="px-4 pt-4">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5" />
                  Rename Location
                </SheetTitle>
              </SheetHeader>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">Kind</div>
                  <div className="mt-1 text-sm font-semibold">
                    {edit ? human(edit.kind) : "-"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-2xl"
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  Disabling is blocked if any stock remains in the location.
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
    </LazyMotion>
  );
}
