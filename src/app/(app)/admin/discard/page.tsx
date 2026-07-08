"use client";

import * as React from "react";
import {
  ShieldAlert,
  Trash2,
  AlertTriangle,
  MessageSquareText,
} from "lucide-react";

import { PageHeader } from "@/components/mobile/PageHeader";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { ItemPickerSheet } from "@/components/mobile/ItemPickerSheet";
import { QtyStepper } from "@/components/mobile/QtyStepper";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { discardLost } from "@/actions/transactions";
import { DiscardLostSchema } from "@/actions/transactions/schemas.client";
import { useProperty } from "@/components/PropertyProvider";

const LS_DISCARD_ITEM_FREQ = "laundry:itemFreq:discard";

type SourceKind = "DAMAGED_BIN" | "CLEAN_STORE" | "SOILED_STORE" | "REWASH_BIN";
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

const SOURCE_LABEL: Record<SourceKind, string> = {
  DAMAGED_BIN: "Damaged",
  REWASH_BIN: "Wash again",
  SOILED_STORE: "To be washed",
  CLEAN_STORE: "Ready to use",
};

const REASON_CHIPS = [
  "Torn",
  "Stained",
  "Burn mark",
  "Missing",
  "Old / thin",
  "Other",
] as const;

export default function DiscardPage() {
  const boot = useBootstrap();
  const { propertyId: appPropertyId, selectProperty } = useProperty();

  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<SourceKind>("DAMAGED_BIN");

  // keyboard-less by default: quick chips set this string
  const [reason, setReason] = React.useState("");
  const [noteSheetOpen, setNoteSheetOpen] = React.useState(false);

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

  const { isSubmitting, submit } = useSubmitAction(discardLost as any, {
    successTitle: "Discard saved",
    errorTitle: "Discard failed",
  });

  const canSubmit = !!propertyId && totalQty > 0 && !isSubmitting;

  const bumpFreq = (id: string) => {
    try {
      const freq = readJson<Record<string, number>>(LS_DISCARD_ITEM_FREQ, {});
      freq[id] = (freq[id] ?? 0) + 1;
      writeJson(LS_DISCARD_ITEM_FREQ, freq);
    } catch {
      // ignore
    }
  };

  const onAddItem = (id: string) => {
    setLines((prev) =>
      prev.some((x) => x.linenItemId === id)
        ? prev
        : [...prev, { linenItemId: id, qty: 0 }]
    );
    bumpFreq(id);
  };

  const onRemoveItem = (id: string) => {
    setLines((prev) => prev.filter((x) => x.linenItemId !== id));
  };

  const setQty = (id: string, qty: number) => {
    setLines((prev) =>
      prev.map((x) => (x.linenItemId === id ? { ...x, qty } : x))
    );
  };

  const quickItems = React.useMemo(() => {
    if (!items.length) return [];
    let freq: Record<string, number> = {};
    if (typeof window !== "undefined") {
      freq = readJson<Record<string, number>>(LS_DISCARD_ITEM_FREQ, {});
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

  const onSubmit = async () => {
    if (!propertyId) return;
    selectProperty(propertyId);

    const payload = {
      propertyId,
      reason: reason.trim() || undefined,
      sourceLocationKind: source,
      idempotencyKey: newIdempotencyKey(),
      lines: lines.filter((l) => l.qty > 0),
    };

    const parsed = DiscardLostSchema.safeParse(payload as any);
    if (!parsed.success) return;

    const res = await submit(parsed.data as any);
    if (res?.ok) setDone(true);
  };

  const onNew = () => {
    setReason("");
    setLines([]);
    setSource("DAMAGED_BIN");
    setDone(false);
  };

  const propertyOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];

  const headerRight = (
    <Badge
      variant="secondary"
      className="rounded-full bg-damaged-soft text-xs text-damaged"
    >
      <ShieldAlert className="mr-1 h-4 w-4" />
      Discard
    </Badge>
  );

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        title="Discard / Damage"
        subtitle="Remove linen that is thrown away, lost, or damaged"
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

        {/* Source (big segmented control, no sheet needed) */}
        {!done && (
          <section className="surface rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Source</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Where are you removing linen from?
                </div>
              </div>
              <Badge className="rounded-full bg-damaged text-primary-foreground">
                {SOURCE_LABEL[source]}
              </Badge>
            </div>

            <Separator className="my-3" />

            <Tabs
              value={source}
              onValueChange={(v) => setSource(v as SourceKind)}
            >
              <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="DAMAGED_BIN"
                  className="h-12 rounded-xl border bg-card text-sm data-[state=active]:border-transparent data-[state=active]:bg-damaged data-[state=active]:text-primary-foreground"
                >
                  Damaged
                </TabsTrigger>
                <TabsTrigger
                  value="REWASH_BIN"
                  className="h-12 rounded-xl border bg-card text-sm data-[state=active]:border-transparent data-[state=active]:bg-damaged data-[state=active]:text-primary-foreground"
                >
                  Wash again
                </TabsTrigger>
                <TabsTrigger
                  value="SOILED_STORE"
                  className="h-12 rounded-xl border bg-card text-sm data-[state=active]:border-transparent data-[state=active]:bg-damaged data-[state=active]:text-primary-foreground"
                >
                  To be washed
                </TabsTrigger>
                <TabsTrigger
                  value="CLEAN_STORE"
                  className="h-12 rounded-xl border bg-card text-sm data-[state=active]:border-transparent data-[state=active]:bg-damaged data-[state=active]:text-primary-foreground"
                >
                  Ready to use
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </section>
        )}

        {/* Reason (chips + optional note sheet) */}
        {!done && (
          <section className="surface rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Reason (optional)</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Tap a chip. Add note only if needed.
                </div>
              </div>

              <Sheet open={noteSheetOpen} onOpenChange={setNoteSheetOpen}>
                <SheetTrigger asChild>
                  <Button type="button" variant="secondary" size="lg">
                    <MessageSquareText className="h-4 w-4" />
                    Note
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="bottom"
                  className="h-[60vh] rounded-t-3xl bg-background p-0"
                >
                  <div className="flex h-full flex-col">
                    <SheetHeader className="px-4 pt-4">
                      <SheetTitle className="text-base">
                        Reason note
                      </SheetTitle>
                    </SheetHeader>

                    <div className="px-4 pb-3 pt-2 text-sm text-muted-foreground">
                      Type only if you really need a note.
                    </div>

                    <Separator />

                    <div className="flex-1 space-y-3 p-4">
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. torn, stained, missing..."
                        className="min-h-[140px] rounded-xl"
                      />

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="lg"
                          className="flex-1"
                          onClick={() => {
                            setReason("");
                            setNoteSheetOpen(false);
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          className="flex-1"
                          onClick={() => setNoteSheetOpen(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Separator className="my-3" />

            <div className="flex flex-wrap gap-2">
              {REASON_CHIPS.map((chip) => {
                const active =
                  reason.trim().toLowerCase() === chip.toLowerCase();
                return (
                  <Button
                    key={chip}
                    type="button"
                    variant={active ? "default" : "secondary"}
                    size="sm"
                    className="h-11 rounded-full px-3"
                    onClick={() => setReason(active ? "" : chip)}
                  >
                    {chip}
                  </Button>
                );
              })}

              {reason.trim() ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-11 rounded-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setReason("")}
                >
                  Clear
                </Button>
              ) : null}
            </div>

            {reason.trim() ? (
              <div className="mt-3 text-sm text-muted-foreground">
                Selected:{" "}
                <span className="font-medium text-foreground">
                  {reason.trim()}
                </span>
              </div>
            ) : null}
          </section>
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
            disabled={boot.loading || !propertyId}
          />
        )}

        {/* Done state */}
        {done ? (
          <section className="surface animate-fade-up rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-damaged-soft text-damaged">
                <ShieldAlert className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="text-base font-semibold">Discard saved</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Start a new discard when ready.
                </div>
              </div>
            </div>

            <Button size="xl" className="mt-4 w-full" onClick={onNew}>
              New discard
            </Button>
          </section>
        ) : (
          <>
            {/* Lines */}
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
                      className="surface animate-fade-up rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold leading-tight">
                            {item?.name ?? "Item"}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Qty to discard
                            {item?.unit ? (
                              <span className="ml-1">&middot; {item.unit}</span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <QtyStepper
                            value={l.qty}
                            onChange={(v) => setQty(l.linenItemId, v)}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => onRemoveItem(l.linenItemId)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        </div>
                      </div>
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
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold" data-numeric>
              {totalQty}
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {totalLines} items
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                Source: {SOURCE_LABEL[source]}
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
            <ShieldAlert className="mr-2 h-5 w-5" />
            Submit discard
          </Button>
        </StickyBar>
      )}
    </div>
  );
}
