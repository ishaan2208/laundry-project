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
import { upsertProperty } from "@/actions/masters/upsertProperty";
import { togglePropertyActive } from "@/actions/masters/togglePropertyActive";

type Row = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: Date;
};

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Your hotels / properties
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button onClick={startAdd}>Add</Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>
                {editing ? "Edit Property" : "Add Property"}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Limewood, Zenvana..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Code (optional)</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="H1, LW..."
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
                Creating a property auto-creates default locations + vendor
                locations.
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-2">
        {initial.map((p) => (
          <Card key={p.id} className="rounded-2xl">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.code ? `Code: ${p.code}` : "No code"}
                </div>

                <div className="mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-muted-foreground">
                  {p.isActive ? "Active" : "Disabled"}
                </div>
                <Switch
                  checked={p.isActive}
                  onCheckedChange={(next) =>
                    startTransition(async () => {
                      await togglePropertyActive({ id: p.id, isActive: next });
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
