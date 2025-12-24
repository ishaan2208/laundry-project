"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserAdmin } from "@/actions/admin/users/updateUserAdmin";
import { toggleUserActiveAdmin } from "@/actions/admin/users/toggleUserActive";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  properties: { propertyId: string }[];
};

type Property = { id: string; name: string; code?: string | null };

export default function UserEditSheet({
  user,
  properties,
}: {
  user: UserRow;
  properties: Property[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);

  const [name, setName] = useState(user.name ?? "");
  const [role, setRole] = useState(user.role as any);
  const [selectedProps, setSelectedProps] = useState<string[]>(
    user.properties.map((p) => p.propertyId)
  );

  function startEdit() {
    setName(user.name ?? "");
    setRole(user.role as any);
    setSelectedProps(user.properties.map((p) => p.propertyId));
    setOpen(true);
  }

  async function save() {
    await updateUserAdmin({
      userId: user.id,
      name: name || null,
      role,
      propertyIds: selectedProps,
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="truncate font-medium">{user.name ?? user.email}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>

          <div className="mt-2 flex gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="secondary" size="sm" onClick={startEdit}>
                  Edit
                </Button>
              </SheetTrigger>

              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Edit user</SheetTitle>
                </SheetHeader>

                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Name (optional)</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select
                      onValueChange={(v) => setRole(v as any)}
                      defaultValue={role}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={role} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="HOUSEKEEPING">
                          HOUSEKEEPING
                        </SelectItem>
                        <SelectItem value="ACCOUNTANT">ACCOUNTANT</SelectItem>
                        <SelectItem value="STOREKEEPER">STOREKEEPER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Properties</Label>
                    <div className="flex flex-wrap gap-2">
                      {properties.map((p) => {
                        const checked = selectedProps.includes(p.id);

                        return (
                          <Button
                            key={p.id}
                            variant={checked ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedProps((prev) =>
                                prev.includes(p.id)
                                  ? prev.filter((x) => x !== p.id)
                                  : [...prev, p.id]
                              );
                            }}
                          >
                            {p.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={pending}
                    onClick={() => startTransition(save)}
                  >
                    Save
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="text-xs text-muted-foreground">{user.role}</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-muted-foreground">
            {user.isActive ? "Active" : "Disabled"}
          </div>
          <Switch
            checked={user.isActive}
            onCheckedChange={(next) =>
              startTransition(async () => {
                await toggleUserActiveAdmin({
                  userId: user.id,
                  isActive: next,
                });
                router.refresh();
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
