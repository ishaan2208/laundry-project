"use client";

import * as React from "react";
import {
  CheckCircle2,
  ShoppingCart,
  Receipt,
  Trash2,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";

import { PageHeader } from "@/components/mobile/PageHeader";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { ItemPickerSheet } from "@/components/mobile/ItemPickerSheet";
import { QtyStepper } from "@/components/mobile/QtyStepper";
import { InlineField } from "@/components/mobile/InlineField";

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
import { useProperty } from "@/components/PropertyProvider";

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
          <span className="grid size-9 place-items-center rounded-xl bg-clean-soft text-clean">
            <IndianRupee className="h-4.5 w-4.5" />
          </span>
          <div>
            <div className="text-sm font-semibold">Unit cost (optional)</div>
            <div className="text-xs text-muted-foreground">
              Tap chips or +/- (no typing)
            </div>
          </div>
        </div>

        <Badge variant="secondary" className="rounded-full" data-numeric>
          &#8377; {value == null ? "—" : money(value)}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-11 rounded-full px-3"
          disabled={props.disabled}
          onClick={() => bump(-10)}
        >
          &minus;10
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-11 rounded-full px-3"
          disabled={props.disabled}
          onClick={() => bump(-50)}
        >
          &minus;50
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-11 rounded-full px-3"
          disabled={props.disabled}
          onClick={() => bump(+10)}
        >
          +10
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-11 rounded-full px-3"
          disabled={props.disabled}
          onClick={() => bump(+50)}
        >
          +50
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-11 rounded-full px-3"
          disabled={props.disabled}
          onClick={() => bump(+100)}
        >
          +100
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-11 rounded-full px-3 text-muted-foreground hover:text-foreground"
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
  const { propertyId: appPropertyId, selectProperty } = useProperty();

  const [propertyId, setPropertyId] = React.useState<string | null>(null);

  // typing only if user opens sheet
  const [reference, setReference] = React.useState("");
  const [refSheetOpen, setRefSheetOpen] = React.useState(false);

  const [lines, setLines] = React.useState<Line[]>([]);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!boot.data?.properties?.length) return;
    const saved = appPropertyId;
    const first = boot.data.properties[0].id;
    setPropertyId(
      saved && boot.data.properties.some((p) => p.id === saved) ? saved : first
    );
  }, [boot.data?.properties, appPropertyId]);

  const items = React.useMemo(() => boot.data?.items ?? [], [boot.data?.items]);

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
    selectProperty(propertyId);

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
      className="rounded-full bg-clean-soft text-xs text-clean"
    >
      <ShoppingCart className="mr-1 h-4 w-4" />
      Procurement
    </Badge>
  );

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        title="Procurement"
        subtitle="Add new stock into the ready-to-use store"
        right={headerRight as any}
      />

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pb-28 pt-4">
        {/* Property */}
        {boot.loading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
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
        <section className="surface rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="grid size-9 place-items-center rounded-xl bg-clean-soft text-clean">
                  <Receipt className="h-4.5 w-4.5" />
                </span>
                Invoice reference
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {reference.trim() ? (
                  <span className="font-medium text-foreground">
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
                  size="lg"
                  disabled={boot.loading}
                >
                  {reference.trim() ? "Edit" : "Add"}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[60vh] rounded-t-3xl bg-background p-0"
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

                  <Separator />

                  <div className="flex-1 p-4">
                    <InlineField label="Reference (optional)">
                      <Input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="e.g. INV-1209"
                        className="h-14 rounded-xl"
                      />
                    </InlineField>

                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="flex-1"
                        onClick={() => {
                          setReference("");
                          setRefSheetOpen(false);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        className="flex-1"
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
        </section>

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
          <section className="surface animate-fade-up rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-clean-soft text-clean">
                <CheckCircle2 className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="text-base font-semibold">
                  Procurement saved
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Add a new procurement when ready.
                </div>
              </div>
            </div>

            <Button size="xl" className="mt-4 w-full" onClick={onNew}>
              New procurement
            </Button>
          </section>
        ) : (
          <>
            {/* Empty state */}
            {lines.length === 0 ? (
              <section className="surface rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <AlertTriangle className="size-5" />
                  </span>
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
              </section>
            ) : (
              <div className="space-y-3">
                {lines.map((l) => {
                  const item = items.find((i) => i.id === l.linenItemId);

                  return (
                    <section
                      key={l.linenItemId}
                      className="surface animate-fade-up space-y-3 rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold leading-tight">
                            {item?.name ?? "Item"}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Qty + cost (optional)
                            {item?.unit ? (
                              <span className="ml-1">&middot; {item.unit}</span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <QtyStepper
                            value={l.qty}
                            onChange={(v) => setLine(l.linenItemId, { qty: v })}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => onRemoveItem(l.linenItemId)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <UnitCostControl
                        value={(l.unitCost ?? null) as any}
                        onChange={(next) =>
                          setLine(l.linenItemId, { unitCost: next })
                        }
                      />
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Sticky bottom CTA */}
      {!done && (
        <StickyBar>
          <div className="flex items-center justify-between pb-2 text-sm">
            <div className="text-muted-foreground">Total qty</div>
            <div className="font-semibold" data-numeric>
              {totalQty}
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {totalLines} items
              </Badge>

              <Badge variant="secondary" className="rounded-full" data-numeric>
                Amount:{" "}
                {totalAmount == null ? "—" : `₹ ${money(totalAmount)}`}
              </Badge>

              {isSubmitting ? (
                <Badge className="rounded-full">Saving&hellip;</Badge>
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
            size="xl"
            className="w-full"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Submit procurement
          </Button>
        </StickyBar>
      )}
    </div>
  );
}
