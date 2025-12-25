"use client";

import * as React from "react";
import {
  LazyMotion,
  domAnimation,
  AnimatePresence,
  m,
  useReducedMotion,
} from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Truck,
  Trash2,
  Inbox,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/mobile/PageHeader";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { ItemPickerSheet } from "@/components/mobile/ItemPickerSheet";
import { QtyStepper } from "@/components/mobile/QtyStepper";
import { StatusPill } from "@/components/mobile/StatusPill";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useBootstrap } from "@/hooks/useBootstrap";
import { useSubmitAction, newIdempotencyKey } from "@/hooks/useSubmitAction";
import { getPendingItemsForVendor } from "@/actions/ui/getPendingItemsForVendor";

// Thread D action
import { receiveFromLaundry } from "@/actions/transactions";
import { ReceiveFromLaundrySchema } from "@/actions/transactions/schemas.client";

const LS_PROPERTY = "laundry:lastPropertyId";
const LS_VENDOR = "laundry:lastVendorId:receive";
const LS_RECEIVE_ITEM_FREQ = "laundry:itemFreq:receive";

type ReceiveLine = {
  linenItemId: string;
  cleanQty: number;
  damagedQty: number;
  rewashQty: number;
};

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

export default function ReceivePage() {
  const boot = useBootstrap();
  const reduceMotion = useReducedMotion();

  const [done, setDone] = React.useState(false);

  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [vendorId, setVendorId] = React.useState<string | null>(null);

  // Big toggle: Pending vs All
  const [view, setView] = React.useState<"PENDING" | "ALL">("PENDING");

  const [pendingLoading, setPendingLoading] = React.useState(false);
  const [pendingMap, setPendingMap] = React.useState<
    Record<string, { soiled: number; rewash: number; total: number }>
  >({});

  const [lines, setLines] = React.useState<ReceiveLine[]>([]);

  // Bootstrap defaults
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

  // Load pending per vendor & prefill items list
  React.useEffect(() => {
    if (!propertyId || !vendorId) return;

    setPendingLoading(true);
    setPendingMap({}); // avoid stale
    (async () => {
      const res = await getPendingItemsForVendor({ propertyId, vendorId });
      if (!res.ok) {
        setPendingLoading(false);
        return;
      }

      const map: Record<
        string,
        { soiled: number; rewash: number; total: number }
      > = {};
      for (const r of res.rows) {
        map[r.linenItemId] = {
          soiled: r.pendingSoiled,
          rewash: r.pendingRewash,
          total: r.totalPending,
        };
      }
      setPendingMap(map);

      // Prefill lines with pending items (only if user hasn’t started editing)
      setLines((prev) => {
        if (prev.length) return prev;
        return res.rows.map((r) => ({
          linenItemId: r.linenItemId,
          cleanQty: 0,
          damagedQty: 0,
          rewashQty: 0,
        }));
      });

      setPendingLoading(false);
    })();
  }, [propertyId, vendorId]);

  const items = boot.data?.items ?? [];

  const selectedIds = React.useMemo(
    () => new Set(lines.map((l) => l.linenItemId)),
    [lines]
  );

  const visibleLines = React.useMemo(() => {
    if (view === "ALL") return lines;
    return lines.filter((l) => (pendingMap[l.linenItemId]?.total ?? 0) > 0);
  }, [lines, view, pendingMap]);

  const totalEntered = React.useMemo(
    () =>
      lines.reduce((s, l) => s + l.cleanQty + l.damagedQty + l.rewashQty, 0),
    [lines]
  );

  const totalPending = React.useMemo(() => {
    if (!propertyId || !vendorId) return 0;
    return Object.values(pendingMap).reduce((s, x) => s + (x.total || 0), 0);
  }, [pendingMap, propertyId, vendorId]);

  const { isSubmitting, submit } = useSubmitAction(receiveFromLaundry as any, {
    successTitle: "Receive saved",
    errorTitle: "Receive failed",
  });

  const canSubmit =
    !!propertyId && !!vendorId && totalEntered > 0 && !isSubmitting;

  const bumpFreq = (id: string) => {
    try {
      const freq = readJson<Record<string, number>>(LS_RECEIVE_ITEM_FREQ, {});
      freq[id] = (freq[id] ?? 0) + 1;
      writeJson(LS_RECEIVE_ITEM_FREQ, freq);
    } catch {
      // ignore
    }
  };

  const onAddItem = (id: string) => {
    setLines((prev) =>
      prev.some((x) => x.linenItemId === id)
        ? prev
        : [
            ...prev,
            { linenItemId: id, cleanQty: 0, damagedQty: 0, rewashQty: 0 },
          ]
    );
    bumpFreq(id);
  };

  const onRemoveItem = (id: string) => {
    setLines((prev) => prev.filter((x) => x.linenItemId !== id));
  };

  const setLine = (id: string, patch: Partial<ReceiveLine>) => {
    setLines((prev) =>
      prev.map((x) => (x.linenItemId === id ? { ...x, ...patch } : x))
    );
  };

  const onSubmit = async () => {
    if (!propertyId || !vendorId) return;
    localStorage.setItem(LS_PROPERTY, propertyId);
    localStorage.setItem(LS_VENDOR, vendorId);

    const payload = {
      propertyId,
      vendorId,
      idempotencyKey: newIdempotencyKey(),
      lines: lines
        .map((l) => ({
          linenItemId: l.linenItemId,
          receivedCleanQty: l.cleanQty,
          damagedQty: l.damagedQty,
          rewashQty: l.rewashQty,
        }))
        .filter((l) => l.receivedCleanQty + l.damagedQty + l.rewashQty > 0),
    };

    const parsed = ReceiveFromLaundrySchema.safeParse(payload as any);
    if (!parsed.success) return;

    const res = await submit(parsed.data as any);
    if (res?.ok) setDone(true);
  };

  const onNewReceive = () => {
    setLines([]);
    setPendingMap({});
    setDone(false);
    setView("PENDING");
  };

  const propertyOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const vendorOptions =
    boot.data?.vendors.map((v) => ({ value: v.id, label: v.name })) ?? [];

  const quickItems = React.useMemo(() => {
    if (!items.length) return [];
    let freq: Record<string, number> = {};
    if (typeof window !== "undefined") {
      freq = readJson<Record<string, number>>(LS_RECEIVE_ITEM_FREQ, {});
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

    if (ranked.length) return ranked;
    return items.slice(0, 8).map((it) => ({
      id: it.id,
      name: it.name,
      subtitle: it.unit ?? undefined,
    }));
  }, [items]);

  const headerRight = (
    <Badge
      variant="secondary"
      className="rounded-2xl border border-violet-200/60 bg-white/60 text-xs text-violet-700 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40 dark:text-violet-200"
    >
      <Inbox className="mr-1 h-4 w-4" />
      Receive
    </Badge>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <PageHeader title="Receive" right={headerRight as any} />

      <main className="mx-auto w-full max-w-md space-y-4 px-3 pb-28 pt-4">
        {/* No property assigned */}
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

        {/* Pending/All tabs (big, thumb-friendly) */}
        {!done && (
          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Laundry → Store</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Enter received qty (Clean / Damaged / Rewash).
                  </div>
                </div>

                <Badge className="rounded-2xl bg-violet-600 text-white dark:bg-violet-500">
                  {totalEntered} pcs
                </Badge>
              </div>

              <Separator className="my-3 opacity-60" />

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Vendor pending:{" "}
                  <span className="font-semibold text-foreground">
                    {totalPending}
                  </span>
                </div>

                <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                  <TabsList className="h-12 rounded-2xl bg-white/60 p-1 backdrop-blur-[2px] dark:bg-zinc-950/40">
                    <TabsTrigger
                      value="PENDING"
                      className="h-10 rounded-2xl px-4 text-sm"
                    >
                      Pending
                    </TabsTrigger>
                    <TabsTrigger
                      value="ALL"
                      className="h-10 rounded-2xl px-4 text-sm"
                    >
                      All
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add items */}
        {!done && (
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
                        Receive saved
                        <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Start a new receive when ready.
                      </div>
                    </div>
                  </div>

                  <Button
                    className="mt-4 h-14 w-full rounded-2xl bg-violet-600 text-base font-semibold text-white hover:bg-violet-600/90 dark:bg-violet-500 dark:hover:bg-violet-500/90"
                    onClick={onNewReceive}
                  >
                    New Receive
                  </Button>
                </CardContent>
              </Card>
            </m.div>
          </LazyMotion>
        ) : (
          <>
            {/* Loading state for pending */}
            {propertyId && vendorId && pendingLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-28 w-full rounded-3xl" />
              </div>
            ) : visibleLines.length === 0 ? (
              <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-violet-600/10 p-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">
                        {view === "PENDING"
                          ? "No pending items"
                          : "No items yet"}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {view === "PENDING"
                          ? "Switch to All or add items manually."
                          : "Tap Add Items to start."}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <LazyMotion features={domAnimation}>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {visibleLines.map((l) => {
                      const item = items.find((i) => i.id === l.linenItemId);
                      const pending = pendingMap[l.linenItemId]?.total ?? 0;
                      const entered = l.cleanQty + l.damagedQty + l.rewashQty;
                      const over = pending > 0 && entered > pending;

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
                              {/* Header row */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-base font-semibold leading-tight">
                                    {item?.name ?? "Item"}
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                                    >
                                      Pending: {pending}
                                    </Badge>

                                    <Badge
                                      className={`rounded-2xl ${
                                        over
                                          ? "bg-amber-500 text-white"
                                          : "bg-violet-600 text-white dark:bg-violet-500"
                                      }`}
                                    >
                                      Entered: {entered}
                                    </Badge>

                                    {over ? (
                                      <span className="text-xs text-amber-600 dark:text-amber-300">
                                        Over pending
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

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

                              <Separator className="my-3 opacity-60" />

                              {/* Qty rows */}
                              <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <StatusPill condition="CLEAN" />
                                    <div className="text-sm font-medium">
                                      Clean
                                    </div>
                                  </div>
                                  <QtyStepper
                                    value={l.cleanQty}
                                    onChange={(v) =>
                                      setLine(l.linenItemId, { cleanQty: v })
                                    }
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <StatusPill condition="DAMAGED" />
                                    <div className="text-sm font-medium">
                                      Damaged
                                    </div>
                                  </div>
                                  <QtyStepper
                                    value={l.damagedQty}
                                    onChange={(v) =>
                                      setLine(l.linenItemId, { damagedQty: v })
                                    }
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <StatusPill condition="REWASH" />
                                    <div className="text-sm font-medium">
                                      Rewash
                                    </div>
                                  </div>
                                  <QtyStepper
                                    value={l.rewashQty}
                                    onChange={(v) =>
                                      setLine(l.linenItemId, { rewashQty: v })
                                    }
                                  />
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

      {/* Sticky bottom CTA (hide when done) */}
      {!done && (
        <StickyBar>
          <div className="flex items-center justify-between pb-2 text-sm">
            <div className="text-muted-foreground">Total entered</div>
            <div className="font-semibold">{totalEntered}</div>
          </div>

          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
              >
                Pending {totalPending}
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
            ) : totalEntered === 0 ? (
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
            Submit Receive
          </Button>
        </StickyBar>
      )}
    </div>
  );
}
