"use client";

import * as React from "react";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
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

function roleTone(role: string) {
  if (role === "ADMIN")
    return "bg-violet-600/15 text-violet-700 dark:text-violet-200";
  if (role === "HOUSEKEEPING")
    return "bg-fuchsia-600/15 text-fuchsia-700 dark:text-fuchsia-200";
  return "bg-muted text-foreground";
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
  const reduceMotion = useReducedMotion();

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
    <LazyMotion features={domAnimation}>
      <m.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      >
        <Card className="rounded-3xl border bg-background/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="relative">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border bg-background/50 text-sm font-semibold">
                  {initials(user.name ?? user.email)}
                </div>
                <div className="relative -bottom-1 -right-1"></div>
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {user.name ?? user.email}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{user.email}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1 rounded-full">
                    <Building2 className="h-3.5 w-3.5" />
                    {selectedCount} properties
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={[
                      "h-6 rounded-full px-2 text-[11px]",
                      roleTone(user.role),
                      "border border-white/20 dark:border-white/10",
                    ].join(" ")}
                  >
                    <Shield className="mr-1 h-3.5 w-3.5" />
                    {user.role}
                  </Badge>
                  {selectedLabels.length ? (
                    <Badge variant="secondary" className="rounded-full">
                      {selectedLabels.join(" • ")}
                      {selectedCount > 2 ? ` +${selectedCount - 2}` : ""}
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-3">
                  <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-10 rounded-2xl gap-2"
                        onClick={startEdit}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </SheetTrigger>

                    {/* Premium bottom sheet with padding + scroll + fixed footer */}
                    <SheetContent
                      side="bottom"
                      className="h-[92vh] max-h-[92vh] p-0 rounded-t-3xl flex flex-col"
                    >
                      <div className="px-4 pt-4">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <UserRoundCog className="h-5 w-5" />
                            Edit user
                          </SheetTitle>
                        </SheetHeader>

                        <div className="mt-3 rounded-2xl border bg-background/50 p-3">
                          <div className="text-sm font-semibold truncate">
                            {user.name ?? user.email}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                        <div className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                              <Pencil className="h-4 w-4" />
                              Name (optional)
                            </Label>
                            <Input
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Full name"
                              className="h-12 rounded-2xl"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Role
                            </Label>
                            <Select
                              value={role}
                              onValueChange={(v) => setRole(v as any)}
                            >
                              <SelectTrigger className="h-12 rounded-2xl">
                                <SelectValue placeholder={role} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="HOUSEKEEPING">
                                  HOUSEKEEPING
                                </SelectItem>
                                <SelectItem value="ACCOUNTANT">
                                  ACCOUNTANT
                                </SelectItem>
                                <SelectItem value="STOREKEEPER">
                                  STOREKEEPER
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Property access
                            </Label>

                            <div className="rounded-2xl border bg-background/50 p-3">
                              <div className="flex flex-wrap gap-2">
                                {properties.map((p) => {
                                  const checked = selectedProps.includes(p.id);
                                  return (
                                    <Button
                                      key={p.id}
                                      type="button"
                                      variant={checked ? "default" : "outline"}
                                      className="h-10 rounded-2xl px-3"
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
                              <div className="mt-2 text-xs text-muted-foreground">
                                Selected:{" "}
                                <span className="font-medium">
                                  {selectedProps.length}
                                </span>
                              </div>
                            </div>
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
                            type="button"
                            className="h-12 flex-1 rounded-2xl gap-2"
                            disabled={pending}
                            onClick={() => startTransition(save)}
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
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
                className="rounded-full gap-1"
              >
                {user.isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
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
          </CardContent>
        </Card>
      </m.div>
    </LazyMotion>
  );
}
