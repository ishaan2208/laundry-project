"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();

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
    <LazyMotion features={domAnimation}>
      <div className="space-y-4">
        <Card className="rounded-3xl border bg-background/40 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-background/50">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">
                    Properties
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activeCount} active • {initial.length} total
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-2xl border bg-background/50 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4" />
                <div className="min-w-0">
                  Creating a property auto-creates default locations + vendor
                  locations.
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

              <SheetContent
                side="bottom"
                className="h-[92vh] max-h-[92vh] p-0 rounded-t-3xl flex flex-col"
              >
                <div className="px-4 pt-4">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {editing ? "Edit Property" : "Add Property"}
                    </SheetTitle>
                  </SheetHeader>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Name
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Limewood, Zenvana..."
                        className="h-12 rounded-2xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Code (optional)
                      </Label>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="H1, LW..."
                        className="h-12 rounded-2xl"
                      />
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

        <div className="space-y-2">
          {initial.map((p) => (
            <m.div
              key={p.id}
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
                        {p.name}
                      </div>
                      {p.isActive ? (
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
                      {p.code ? `Code: ${p.code}` : "No code"} · Created{" "}
                      {fmtDate(p.createdAt)}
                    </div>

                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-10 rounded-2xl gap-2"
                        onClick={() => startEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-muted-foreground">
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
                </CardContent>
              </Card>
            </m.div>
          ))}
        </div>
      </div>
    </LazyMotion>
  );
}
