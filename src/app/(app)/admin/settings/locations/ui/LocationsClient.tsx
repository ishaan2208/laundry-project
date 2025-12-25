"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Property</div>
        <Select
          value={propertyId ?? ""}
          onValueChange={(v) =>
            router.push(
              `/settings/locations?propertyId=${encodeURIComponent(v)}`
            )
          }
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">
          Showing locations for: {title}
        </div>
      </div>

      <div className="space-y-2">
        {initial.map((loc) => (
          <Card key={loc.id} className="rounded-2xl">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate font-medium">{loc.name}</div>
                  <Badge variant="secondary" className="shrink-0">
                    {loc.kind === "VENDOR" && loc.vendor?.name
                      ? `Vendor • ${loc.vendor.name}`
                      : loc.kind}
                  </Badge>
                </div>

                <div className="mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(loc)}
                  >
                    Rename
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-muted-foreground">
                  {loc.isActive ? "Active" : "Disabled"}
                </div>
                <Switch
                  checked={loc.isActive}
                  onCheckedChange={(next) =>
                    startTransition(async () => {
                      const res = await toggleLocationActive({
                        id: loc.id,
                        isActive: next,
                      });
                      if (res?.ok === false) alert(res.message ?? "Blocked");
                      router.refresh();
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Rename Location</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <Button
              className="w-full"
              disabled={pending || name.trim().length < 2}
              onClick={() => startTransition(save)}
            >
              Save
            </Button>

            <div className="text-xs text-muted-foreground">
              Kind is immutable (ledger-safe). Disabling is blocked if any stock
              remains in the location.
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
