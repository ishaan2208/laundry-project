"use client";

import * as React from "react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import {
  CheckCircle2,
  Truck,
  PackagePlus,
  Trash2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/mobile/PageHeader";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { ItemPickerSheet } from "@/components/mobile/ItemPickerSheet";
import { QtyStepper } from "@/components/mobile/QtyStepper";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { useBootstrap } from "@/hooks/useBootstrap";
import { useSubmitAction, newIdempotencyKey } from "@/hooks/useSubmitAction";

// Thread D action
import { dispatchToLaundry } from "@/actions/transactions";
import { DispatchToLaundrySchema } from "@/actions/transactions/schemas.client";

const LS_PROPERTY = "laundry:lastPropertyId";
const LS_VENDOR = "laundry:lastVendorId:dispatch";
const LS_DISPATCH_ITEM_FREQ = "laundry:itemFreq:dispatch";

type Line = { linenItemId: string; qty: number };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function DispatchPage() {
  const boot = useBootstrap();
  const reduceMotion = useReducedMotion();

  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [vendorId, setVendorId] = React.useState<string | null>(null);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [done, setDone] = React.useState(false);

  // Bootstrap defaults (localStorage -> first available)
  React.useEffect(() => {
    if (!boot.data?.properties?.length) return;
    const saved = localStorage.getItem(LS_PROPERTY);
    const first = boot.data.properties[0].id;
    setPropertyId(
      saved && boot.data.properties.some((p) => p.id === saved) ? saved : first
    );
  }, [boot.data?.properties]);

  React.useEffect(() => {
    if (!boot.data?.vendors?.length) return;
    const saved = localStorage.getItem(LS_VENDOR);
    if (saved && boot.data.vendors.some((v) => v.id === saved))
      setVendorId(saved);
  }, [boot.data?.vendors]);

  const items = boot.data?.items ?? [];

  const selectedIds = React.useMemo(
    () => new Set(lines.map((l) => l.linenItemId)),
    [lines]
  );

  const totalQty = React.useMemo(
    () => lines.reduce((s, l) => s + (l.qty || 0), 0),
    [lines]
  );

  const totalLines = React.useMemo(
    () => lines.filter((l) => (l.qty || 0) > 0).length,
    [lines]
  );

  const { isSubmitting, submit } = useSubmitAction(dispatchToLaundry as any, {
    successTitle: "Dispatch saved",
    errorTitle: "Dispatch failed",
  });

  const canSubmit = !!propertyId && !!vendorId && totalQty > 0 && !isSubmitting;

  const propertyOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const vendorOptions =
    boot.data?.vendors.map((v) => ({ value: v.id, label: v.name })) ?? [];

  const selectedProperty = propertyOptions.find((o) => o.value === propertyId);
  const selectedVendor = vendorOptions.find((o) => o.value === vendorId);

  const quickItems = React.useMemo(() => {
    // Top items from local usage frequency (dispatch only)
    if (!items.length) return [];
    let freq: Record<string, number> = {};
    if (typeof window !== "undefined") {
      freq = readJson<Record<string, number>>(LS_DISPATCH_ITEM_FREQ, {});
    }
    const ranked = [...items]
      .map((it) => ({ it, score: freq[it.id] ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .filter((x) => x.score > 0)
      .slice(0, 10)
      .map((x) => ({
        id: x.it.id,
        name: x.it.name,
        subtitle: x.it.unit ?? undefined,
      }));

    // If no history yet, show first few as “quick”
    if (ranked.length) return ranked;
    return items.slice(0, 8).map((it) => ({
      id: it.id,
      name: it.name,
      subtitle: it.unit ?? undefined,
    }));
  }, [items]);

  const onAddItem = (id: string) => {
    setLines((prev) =>
      prev.some((x) => x.linenItemId === id)
        ? prev
        : [...prev, { linenItemId: id, qty: 0 }]
    );

    // bump local frequency for better “quick add” next time (keyboard-less speed)
    try {
      const freq = readJson<Record<string, number>>(LS_DISPATCH_ITEM_FREQ, {});
      freq[id] = (freq[id] ?? 0) + 1;
      writeJson(LS_DISPATCH_ITEM_FREQ, freq);
    } catch {
      // ignore
    }
  };

  const onRemoveItem = (id: string) => {
    setLines((prev) => prev.filter((x) => x.linenItemId !== id));
  };

  const onReset = () => {
    setLines([]);
    setDone(false);
  };

  const onSubmit = async () => {
    if (!propertyId || !vendorId) return;
    localStorage.setItem(LS_PROPERTY, propertyId);
    localStorage.setItem(LS_VENDOR, vendorId);

    const payload = {
      propertyId,
      vendorId,
      idempotencyKey: newIdempotencyKey(),
      lines: lines.filter((l) => l.qty > 0),
    };

    const parsed = DispatchToLaundrySchema.safeParse(payload as any);
    if (!parsed.success) return;

    const res = await submit(parsed.data as any);
    if (res?.ok) setDone(true);
  };

  const setQty = (linenItemId: string, next: number) => {
    setLines((prev) =>
      prev.map((x) => (x.linenItemId === linenItemId ? { ...x, qty: next } : x))
    );
  };

  const headerRight = (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className="rounded-2xl border border-violet-200/60 bg-white/60 text-xs text-violet-700 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40 dark:text-violet-200"
      >
        <Truck className="mr-1 h-4 w-4" />
        Dispatch
      </Badge>
    </div>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <PageHeader title="Dispatch" right={headerRight as any} />

      <main className="mx-auto w-full max-w-md space-y-4 px-3 pb-28 pt-4">
        {/* Empty / access state */}
        {!boot.loading && boot.data?.properties?.length === 0 ? (
          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-violet-600/10 p-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    No property assigned
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Ask admin to assign a property to your account.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Pickers */}
        {boot.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-3xl" />
            <Skeleton className="h-16 w-full rounded-3xl" />
          </div>
        ) : (
          <div className="space-y-3">
            <BottomSheetSelect
              label="Property"
              value={propertyId}
              options={propertyOptions}
              onChange={(v) => {
                setPropertyId(v);
                setDone(false);
              }}
              placeholder="Select property"
              disabled={boot.loading}
              leadingIcon="building"
            />

            <BottomSheetSelect
              label="Vendor"
              value={vendorId}
              options={vendorOptions}
              onChange={(v) => {
                setVendorId(v);
                setDone(false);
              }}
              placeholder="Select vendor"
              disabled={boot.loading || !propertyId}
              leadingIcon="truck"
            />
          </div>
        )}

        {/* Status / Guidance */}
        {!done && (
          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Soiled → Laundry</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Pick vendor, add items, set soiled qty.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="rounded-2xl bg-violet-600 text-white dark:bg-violet-500">
                    {totalQty} pcs
                  </Badge>
                </div>
              </div>

              <Separator className="my-3 opacity-60" />

              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Selected</div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                  >
                    {selectedProperty?.label ?? "—"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                  >
                    {selectedVendor?.label ?? "—"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Done state */}
        {done ? (
          <LazyMotion features={domAnimation}>
            <m.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-violet-600/10 p-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        Dispatch saved
                        <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Start a new dispatch when ready.
                      </div>
                    </div>
                  </div>

                  <Button
                    className="mt-4 h-14 w-full rounded-2xl bg-violet-600 text-base font-semibold text-white hover:bg-violet-600/90 dark:bg-violet-500 dark:hover:bg-violet-500/90"
                    onClick={onReset}
                  >
                    New Dispatch
                  </Button>
                </CardContent>
              </Card>
            </m.div>
          </LazyMotion>
        ) : (
          <>
            {/* Add items */}
            <ItemPickerSheet
              title="Add linen items"
              items={items.map((i) => ({
                id: i.id,
                name: i.name,
                subtitle: i.unit ?? undefined,
              }))}
              quickItems={quickItems}
              selectedIds={selectedIds}
              onAdd={onAddItem}
              disabled={boot.loading || !propertyId || !vendorId}
            />

            {/* Lines */}
            {lines.length === 0 ? (
              <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-violet-600/10 p-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                      <PackagePlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">No items yet</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Tap{" "}
                        <span className="font-medium text-foreground">
                          Add Items
                        </span>{" "}
                        to start.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <LazyMotion features={domAnimation}>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => {
                      const item = items.find((i) => i.id === l.linenItemId);
                      return (
                        <m.div
                          key={l.linenItemId}
                          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                          animate={
                            reduceMotion ? undefined : { opacity: 1, y: 0 }
                          }
                          exit={
                            reduceMotion ? undefined : { opacity: 0, y: -10 }
                          }
                          transition={{ duration: 0.16 }}
                        >
                          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-base font-semibold leading-tight">
                                    {item?.name ?? "Item"}
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    Soiled qty
                                    {item?.unit ? (
                                      <span className="ml-1">
                                        • {item.unit}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <QtyStepper
                                    value={l.qty}
                                    onChange={(next) =>
                                      setQty(l.linenItemId, next)
                                    }
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-foreground"
                                    onClick={() => onRemoveItem(l.linenItemId)}
                                    aria-label="Remove item"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </m.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </LazyMotion>
            )}
          </>
        )}
      </main>

      {/* Sticky bottom CTA */}
      {!done && (
        <StickyBar>
          <div className="flex items-center justify-between pb-2 text-sm">
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold">{totalQty}</div>
          </div>

          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
              >
                {totalLines} items
              </Badge>
              {isSubmitting ? (
                <Badge className="rounded-2xl bg-violet-600 text-white dark:bg-violet-500">
                  Saving…
                </Badge>
              ) : null}
            </div>

            {!propertyId || !vendorId ? (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Pick property & vendor
              </span>
            ) : totalQty === 0 ? (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Add qty
              </span>
            ) : null}
          </div>

          <Button
            className="h-14 w-full rounded-2xl bg-violet-600 text-base font-semibold text-white hover:bg-violet-600/90 disabled:bg-violet-600/40 dark:bg-violet-500 dark:hover:bg-violet-500/90 dark:disabled:bg-violet-500/40"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            <Truck className="mr-2 h-5 w-5" />
            Submit Dispatch
          </Button>
        </StickyBar>
      )}
    </div>
  );
}
