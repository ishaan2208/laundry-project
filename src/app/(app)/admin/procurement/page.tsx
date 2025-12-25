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
  ShoppingCart,
  Receipt,
  Trash2,
  AlertTriangle,
  Sparkles,
  IndianRupee,
} from "lucide-react";

import { PageHeader } from "@/components/mobile/PageHeader";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { ItemPickerSheet } from "@/components/mobile/ItemPickerSheet";
import { QtyStepper } from "@/components/mobile/QtyStepper";
import { InlineField } from "@/components/mobile/InlineField";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useBootstrap } from "@/hooks/useBootstrap";
import { useSubmitAction, newIdempotencyKey } from "@/hooks/useSubmitAction";

// Thread D action
import { createProcurement } from "@/actions/transactions";
import { CreateProcurementSchema } from "@/actions/transactions/schemas.client";

const LS_PROPERTY = "laundry:lastPropertyId";
const LS_PROC_ITEM_FREQ = "laundry:itemFreq:procurement";

type Line = { linenItemId: string; qty: number; unitCost?: number | null };

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

function money(n: number) {
  // simple INR display (avoid Intl cost on low-end phones)
  const s = Math.round(n).toString();
  const last3 = s.slice(-3);
  const other = s.slice(0, -3);
  const withCommas = other.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return other ? `${withCommas},${last3}` : last3;
}

function UnitCostControl(props: {
  value: number | null | undefined;
  onChange: (next: number | null) => void;
  disabled?: boolean;
}) {
  const value = props.value ?? null;

  const bump = (delta: number) => {
    const next = Math.max(0, (value ?? 0) + delta);
    props.onChange(next === 0 ? null : next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            <IndianRupee className="h-4.5 w-4.5" />
          </span>
          <div>
            <div className="text-sm font-semibold">Unit cost (optional)</div>
            <div className="text-xs text-muted-foreground">
              Tap chips or +/- (no typing)
            </div>
          </div>
        </div>

        <Badge
          variant="secondary"
          className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
        >
          ₹ {value == null ? "—" : money(value)}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-2xl border border-violet-200/60 bg-white/60 px-3 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
          disabled={props.disabled}
          onClick={() => bump(-10)}
        >
          −10
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-2xl border border-violet-200/60 bg-white/60 px-3 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
          disabled={props.disabled}
          onClick={() => bump(-50)}
        >
          −50
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-2xl border border-violet-200/60 bg-white/60 px-3 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
          disabled={props.disabled}
          onClick={() => bump(+10)}
        >
          +10
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-2xl border border-violet-200/60 bg-white/60 px-3 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
          disabled={props.disabled}
          onClick={() => bump(+50)}
        >
          +50
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-2xl border border-violet-200/60 bg-white/60 px-3 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
          disabled={props.disabled}
          onClick={() => bump(+100)}
        >
          +100
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-2xl px-3 text-muted-foreground hover:text-foreground"
          disabled={props.disabled || value == null}
          onClick={() => props.onChange(null)}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

export default function ProcurementPage() {
  const boot = useBootstrap();
  const reduceMotion = useReducedMotion();

  const [propertyId, setPropertyId] = React.useState<string | null>(null);

  // typing only if user opens sheet
  const [reference, setReference] = React.useState("");
  const [refSheetOpen, setRefSheetOpen] = React.useState(false);

  const [lines, setLines] = React.useState<Line[]>([]);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!boot.data?.properties?.length) return;
    const saved = localStorage.getItem(LS_PROPERTY);
    const first = boot.data.properties[0].id;
    setPropertyId(
      saved && boot.data.properties.some((p) => p.id === saved) ? saved : first
    );
  }, [boot.data?.properties]);

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

  const totalAmount = React.useMemo(() => {
    let sum = 0;
    let hasAny = false;
    for (const l of lines) {
      if (l.qty > 0 && (l.unitCost ?? null) != null) {
        sum += l.qty * (l.unitCost as number);
        hasAny = true;
      }
    }
    return hasAny ? sum : null;
  }, [lines]);

  const { isSubmitting, submit } = useSubmitAction(createProcurement as any, {
    successTitle: "Procurement saved",
    errorTitle: "Procurement failed",
  });

  const canSubmit = !!propertyId && totalQty > 0 && !isSubmitting;

  const bumpFreq = (id: string) => {
    try {
      const freq = readJson<Record<string, number>>(LS_PROC_ITEM_FREQ, {});
      freq[id] = (freq[id] ?? 0) + 1;
      writeJson(LS_PROC_ITEM_FREQ, freq);
    } catch {
      // ignore
    }
  };

  const onAddItem = (id: string) => {
    setLines((prev) =>
      prev.some((x) => x.linenItemId === id)
        ? prev
        : [...prev, { linenItemId: id, qty: 0, unitCost: null }]
    );
    bumpFreq(id);
  };

  const onRemoveItem = (id: string) => {
    setLines((prev) => prev.filter((x) => x.linenItemId !== id));
  };

  const setLine = (id: string, patch: Partial<Line>) => {
    setLines((prev) =>
      prev.map((x) => (x.linenItemId === id ? { ...x, ...patch } : x))
    );
  };

  const onSubmit = async () => {
    if (!propertyId) return;
    localStorage.setItem(LS_PROPERTY, propertyId);

    const payload = {
      propertyId,
      reference: reference.trim() || undefined,
      idempotencyKey: newIdempotencyKey(),
      lines: lines
        .map((l) => ({
          linenItemId: l.linenItemId,
          qty: l.qty,
          unitCost: l.unitCost ?? undefined,
        }))
        .filter((l) => l.qty > 0),
    };

    const parsed = CreateProcurementSchema.safeParse(payload as any);
    if (!parsed.success) return;

    const res = await submit(parsed.data as any);
    if (res?.ok) {
      setDone(true);
    }
  };

  const onNew = () => {
    setReference("");
    setLines([]);
    setDone(false);
  };

  const propertyOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];

  const quickItems = React.useMemo(() => {
    if (!items.length) return [];
    let freq: Record<string, number> = {};
    if (typeof window !== "undefined") {
      freq = readJson<Record<string, number>>(LS_PROC_ITEM_FREQ, {});
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
      <ShoppingCart className="mr-1 h-4 w-4" />
      Procurement
    </Badge>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <PageHeader title="Procurement" right={headerRight as any} />

      <main className="mx-auto w-full max-w-md space-y-4 px-3 pb-28 pt-4">
        {/* Property */}
        {boot.loading ? (
          <Skeleton className="h-16 w-full rounded-3xl" />
        ) : (
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
        )}

        {/* Invoice ref (optional) – keyboard only if opened */}
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    <Receipt className="h-4.5 w-4.5" />
                  </span>
                  Invoice reference
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {reference.trim() ? (
                    <span className="text-foreground font-medium">
                      {reference.trim()}
                    </span>
                  ) : (
                    "Optional (tap to add)"
                  )}
                </div>
              </div>

              <Sheet open={refSheetOpen} onOpenChange={setRefSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                    disabled={boot.loading}
                  >
                    {reference.trim() ? "Edit" : "Add"}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="h-[60vh] rounded-t-3xl border-violet-200/60 bg-background/80 p-0 backdrop-blur-[2px] dark:border-violet-500/15"
                >
                  <div className="flex h-full flex-col">
                    <SheetHeader className="px-4 pt-4">
                      <SheetTitle className="text-base">
                        Invoice reference
                      </SheetTitle>
                    </SheetHeader>

                    <div className="px-4 pb-3 pt-2 text-sm text-muted-foreground">
                      Only type if you need it. Otherwise skip.
                    </div>

                    <Separator className="opacity-60" />

                    <div className="flex-1 p-4">
                      <InlineField label="Reference (optional)">
                        <Input
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          placeholder="e.g. INV-1209"
                          className="h-14 rounded-2xl border-violet-200/60 bg-white/70 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                        />
                      </InlineField>

                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-12 flex-1 rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                          onClick={() => {
                            setReference("");
                            setRefSheetOpen(false);
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          className="h-12 flex-1 rounded-2xl bg-violet-600 text-white hover:bg-violet-600/90 dark:bg-violet-500 dark:hover:bg-violet-500/90"
                          onClick={() => setRefSheetOpen(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>

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
          disabled={boot.loading || !propertyId}
        />

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
                        Procurement saved
                        <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Add a new procurement when ready.
                      </div>
                    </div>
                  </div>

                  <Button
                    className="mt-4 h-14 w-full rounded-2xl bg-violet-600 text-base font-semibold text-white hover:bg-violet-600/90 dark:bg-violet-500 dark:hover:bg-violet-500/90"
                    onClick={onNew}
                  >
                    New Procurement
                  </Button>
                </CardContent>
              </Card>
            </m.div>
          </LazyMotion>
        ) : (
          <>
            {/* Empty state */}
            {lines.length === 0 ? (
              <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-2xl bg-violet-600/10 p-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                      <AlertTriangle className="h-5 w-5" />
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
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-base font-semibold leading-tight">
                                    {item?.name ?? "Item"}
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    Qty + cost (optional)
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
                                    onChange={(v) =>
                                      setLine(l.linenItemId, { qty: v })
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

                              <Separator className="opacity-60" />

                              <UnitCostControl
                                value={(l.unitCost ?? null) as any}
                                onChange={(next) =>
                                  setLine(l.linenItemId, { unitCost: next })
                                }
                              />
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
            <div className="text-muted-foreground">Total qty</div>
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

              <Badge
                variant="secondary"
                className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
              >
                Amount: {totalAmount == null ? "—" : `₹ ${money(totalAmount)}`}
              </Badge>

              {isSubmitting ? (
                <Badge className="rounded-2xl bg-violet-600 text-white dark:bg-violet-500">
                  Saving…
                </Badge>
              ) : null}
            </div>

            {!propertyId ? (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Pick property
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
            <ShoppingCart className="mr-2 h-5 w-5" />
            Submit Procurement
          </Button>
        </StickyBar>
      )}
    </div>
  );
}
