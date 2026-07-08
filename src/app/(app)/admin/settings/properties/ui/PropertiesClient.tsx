"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
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

import { upsertProperty } from "@/actions/masters/upsertProperty";
import { togglePropertyActive } from "@/actions/masters/togglePropertyActive";

type Row = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: Date;
};

function fmtDate(d: Date) {
  try {
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function PropertiesClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const editing = useMemo(
    () => initial.find((p) => p.id === editId) ?? null,
    [editId, initial]
  );

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  function startAdd() {
    setEditId(null);
    setName("");
    setCode("");
    setOpen(true);
  }

  function startEdit(row: Row) {
    setEditId(row.id);
    setName(row.name);
    setCode(row.code ?? "");
    setOpen(true);
  }

  async function save() {
    const res = await upsertProperty({ id: editId ?? undefined, name, code });
    if (res?.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  const activeCount = initial.filter((p) => p.isActive).length;

  return (
    <div className="space-y-4">
      <div className="surface rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Building2 className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">
                  Properties
                </div>
                <div className="text-sm text-muted-foreground">
                  {activeCount} active · {initial.length} total
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                Creating a property auto-creates default locations + vendor
                locations.
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

            <SheetContent
              side="bottom"
              className="h-[92vh] max-h-[92vh] flex-col rounded-t-3xl p-0"
            >
              <div className="px-4 pt-4">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Building2 className="size-5" />
                    {editing ? "Edit property" : "Add property"}
                  </SheetTitle>
                </SheetHeader>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="size-4" />
                      Name
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Limewood, Zenvana..."
                      className="h-12 rounded-xl text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="size-4" />
                      Code (optional)
                    </Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="H1, LW..."
                      className="h-12 rounded-xl text-base"
                    />
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

      <div className="space-y-2">
        {initial.map((p) => (
          <div key={p.id} className="surface rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold">
                    {p.name}
                  </div>
                  {p.isActive ? (
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
                  {p.code ? `Code: ${p.code}` : "No code"} · Created{" "}
                  {fmtDate(p.createdAt)}
                </div>

                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(p)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-muted-foreground">
                  {p.isActive ? "Enabled" : "Disabled"}
                </div>
                <Switch
                  checked={p.isActive}
                  onCheckedChange={(next) =>
                    startTransition(async () => {
                      await togglePropertyActive({
                        id: p.id,
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
