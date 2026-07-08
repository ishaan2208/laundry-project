"use client";

import * as React from "react";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserRoundCog,
  Mail,
  Shield,
  Building2,
  Pencil,
  CheckCircle2,
  Ban,
  Save,
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

function initials(nameOrEmail: string) {
  const s = (nameOrEmail ?? "").trim();
  if (!s) return "U";
  const parts = s.includes("@")
    ? s.split("@")[0].split(/[.\s_-]+/)
    : s.split(" ");
  const a = (parts[0]?.[0] ?? "U").toUpperCase();
  const b = (parts[1]?.[0] ?? "").toUpperCase();
  return `${a}${b}`.slice(0, 2);
}

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

  const selectedCount = selectedProps.length;

  const selectedLabels = useMemo(() => {
    const map = new Map(properties.map((p) => [p.id, p.name]));
    return selectedProps.map((id) => map.get(id) ?? "Property").slice(0, 2);
  }, [selectedProps, properties]);

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
    <div className="surface rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground">
            {initials(user.name ?? user.email)}
          </span>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {user.name ?? user.email}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Building2 className="size-3.5" />
                {selectedCount} properties
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Shield className="size-3.5" />
                {user.role}
              </Badge>
              {selectedLabels.length ? (
                <Badge variant="secondary">
                  {selectedLabels.join(" · ")}
                  {selectedCount > 2 ? ` +${selectedCount - 2}` : ""}
                </Badge>
              ) : null}
            </div>

            <div className="mt-3">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="sm" onClick={startEdit}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                </SheetTrigger>

                {/* Premium bottom sheet with padding + scroll + fixed footer */}
                <SheetContent
                  side="bottom"
                  className="h-[92vh] max-h-[92vh] flex-col rounded-t-3xl p-0"
                >
                  <div className="px-4 pt-4">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <UserRoundCog className="size-5" />
                        Edit user
                      </SheetTitle>
                    </SheetHeader>

                    <div className="mt-3 rounded-xl bg-muted p-3">
                      <div className="truncate text-sm font-semibold">
                        {user.name ?? user.email}
                      </div>
                      <div className="mt-1 truncate text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Pencil className="size-4" />
                          Name (optional)
                        </Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full name"
                          className="h-12 rounded-xl text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Shield className="size-4" />
                          Role
                        </Label>
                        <Select
                          value={role}
                          onValueChange={(v) => setRole(v as any)}
                        >
                          <SelectTrigger className="h-12 rounded-xl text-base">
                            <SelectValue placeholder={role} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="HOUSEKEEPING">
                              Housekeeping
                            </SelectItem>
                            <SelectItem value="ACCOUNTANT">
                              Accountant
                            </SelectItem>
                            <SelectItem value="STOREKEEPER">
                              Storekeeper
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="size-4" />
                          Property access
                        </Label>

                        <div className="rounded-xl bg-muted p-3">
                          <div className="flex flex-wrap gap-2">
                            {properties.map((p) => {
                              const checked = selectedProps.includes(p.id);
                              return (
                                <Button
                                  key={p.id}
                                  type="button"
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
                          <div className="mt-2 text-sm text-muted-foreground">
                            Selected:{" "}
                            <span className="font-medium">
                              {selectedProps.length}
                            </span>
                          </div>
                        </div>
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
                        type="button"
                        size="lg"
                        className="flex-1"
                        disabled={pending}
                        onClick={() => startTransition(save)}
                      >
                        <Save className="size-4" />
                        Save
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Role + property access affect what the user can do in
                      the app.
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge
            variant={user.isActive ? "secondary" : "destructive"}
            className="gap-1"
          >
            {user.isActive ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <Ban className="size-3.5" />
            )}
            {user.isActive ? "Active" : "Disabled"}
          </Badge>

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
      </div>
    </div>
  );
}
