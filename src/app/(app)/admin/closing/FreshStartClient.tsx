"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Eraser, ChevronRight, Check } from "lucide-react";

import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { CounterList, CounterRow } from "@/components/mobile/CounterList";
import { StickyBar } from "@/components/mobile/StickyBar";
import { SuccessScreen } from "@/components/mobile/SuccessScreen";
import { HelpNote } from "@/components/mobile/HelpNote";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { newIdempotencyKey } from "@/hooks/useSubmitAction";

import {
  getClosingContext,
  type ClosingContext,
} from "@/actions/closing/getClosingContext";
import { runFreshStart } from "@/actions/closing/runFreshStart";
import { useProperty } from "@/components/PropertyProvider";

type PropertyLite = { id: string; name: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FreshStartClient({
  properties,
}: {
  properties: PropertyLite[];
}) {
  const router = useRouter();
  const { propertyId: appPropertyId, selectProperty } = useProperty();

  const [propertyId, setPropertyId] = React.useState<string | null>(
    properties.length === 1 ? properties[0].id : null
  );

  // Adopt the app-wide hotel selection (post-mount: hydration-safe).
  React.useEffect(() => {
    if (propertyId) return;
    if (appPropertyId && properties.some((p) => p.id === appPropertyId)) {
      setPropertyId(appPropertyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appPropertyId]);

  const [loading, setLoading] = React.useState(false);
  const [ctx, setCtx] = React.useState<ClosingContext | null>(null);

  // Counted values, prefilled from the book once context loads.
  const [propCounts, setPropCounts] = React.useState<Record<string, number>>(
    {}
  );
  const [vendCounts, setVendCounts] = React.useState<Record<string, number>>(
    {}
  );
  const [note, setNote] = React.useState("");

  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState<{
    matched: boolean;
    adjusted: number;
  } | null>(null);

  React.useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    setLoading(true);
    setCtx(null);

    (async () => {
      const res = await getClosingContext({ propertyId });
      if (cancelled) return;
      if (!res.ok) {
        toast.error(res.message);
        setLoading(false);
        return;
      }
      setCtx(res.data);
      const p: Record<string, number> = {};
      for (const r of res.data.propertyRows) {
        p[r.linenItemId] = Math.max(0, r.bookQty);
      }
      const v: Record<string, number> = {};
      for (const r of res.data.vendorRows) {
        v[`${r.vendorId}:${r.linenItemId}`] = Math.max(0, r.bookQty);
      }
      setPropCounts(p);
      setVendCounts(v);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const vendorGroups = React.useMemo(() => {
    if (!ctx) return [];
    const map = new Map<
      string,
      {
        vendorId: string;
        vendorName: string;
        rows: ClosingContext["vendorRows"];
      }
    >();
    for (const r of ctx.vendorRows) {
      const g = map.get(r.vendorId) ?? {
        vendorId: r.vendorId,
        vendorName: r.vendorName,
        rows: [],
      };
      g.rows.push(r);
      map.set(r.vendorId, g);
    }
    return [...map.values()];
  }, [ctx]);

  const hasWrongVendorBook = React.useMemo(
    () => (ctx ? ctx.vendorRows.some((r) => r.bookQty < 0) : false),
    [ctx]
  );

  const differences = React.useMemo(() => {
    if (!ctx) return [];
    const out: { name: string; book: number; counted: number }[] = [];
    for (const r of ctx.propertyRows) {
      const counted = propCounts[r.linenItemId] ?? 0;
      if (counted !== r.bookQty) {
        out.push({ name: r.name, book: r.bookQty, counted });
      }
    }
    for (const r of ctx.vendorRows) {
      const counted = vendCounts[`${r.vendorId}:${r.linenItemId}`] ?? 0;
      if (counted !== r.bookQty) {
        out.push({
          name: `${r.itemName} · ${r.vendorName}`,
          book: r.bookQty,
          counted,
        });
      }
    }
    return out;
  }, [ctx, propCounts, vendCounts]);

  const propertyName = properties.find((p) => p.id === propertyId)?.name ?? "";

  async function onConfirm() {
    if (!propertyId || !ctx) return;
    setSaving(true);
    try {
      const res = await runFreshStart({
        propertyId,
        note: note.trim() || undefined,
        idempotencyKey: newIdempotencyKey(),
        propertyLines: ctx.propertyRows.map((r) => ({
          linenItemId: r.linenItemId,
          countedQty: propCounts[r.linenItemId] ?? 0,
        })),
        vendorLines: ctx.vendorRows.map((r) => ({
          vendorId: r.vendorId,
          linenItemId: r.linenItemId,
          countedQty: vendCounts[`${r.vendorId}:${r.linenItemId}`] ?? 0,
        })),
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setReviewOpen(false);
      setDone({ matched: res.matched, adjusted: res.adjustedLines });
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <SuccessScreen
        title="Fresh start done"
        summary={
          done.matched
            ? "Everything already matched"
            : `${done.adjusted} ${done.adjusted === 1 ? "number" : "numbers"} corrected`
        }
        detail={
          done.matched
            ? "The book already matched your count, so nothing needed fixing."
            : "The slate is clean. From now on, the counted numbers are the truth."
        }
        primaryLabel="Done"
        onPrimary={() => router.push("/admin")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <HelpNote>
        Use this when the numbers look wrong — too much showing as pending, or
        minus figures. Count what is really there below, then tap{" "}
        <strong>Review &amp; start fresh</strong> at the bottom to save it as
        one correction entry. Nothing changes until you tap that. You can do
        this any time, as often as needed.
      </HelpNote>

      {properties.length > 1 ? (
        <BottomSheetSelect
          label="Hotel"
          value={propertyId}
          options={properties.map((p) => ({ value: p.id, label: p.name }))}
          onChange={(v) => {
            setPropertyId(v);
            selectProperty(v);
          }}
          placeholder="Choose hotel"
          hint="Reset one hotel at a time."
          leadingIcon="building"
        />
      ) : null}

      {!propertyId ? (
        <div className="surface rounded-2xl p-5 text-center">
          <p className="text-base font-semibold">Choose a hotel to begin</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You will confirm two things: linen at the hotel, and linen still
            with each laundry.
          </p>
        </div>
      ) : loading || !ctx ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <section aria-label="Linen at the hotel">
            <div className="px-1 pb-2">
              <h2 className="text-base font-bold">1 · Linen at the hotel</h2>
              <p className="text-sm text-muted-foreground">
                What the book says is pre-filled. Change any number that does
                not match what you really have.
              </p>
            </div>
            {ctx.propertyRows.length === 0 ? (
              <div className="surface rounded-2xl p-4 text-center text-sm text-muted-foreground">
                No linen items on the book yet.
              </div>
            ) : (
              <CounterList>
                {ctx.propertyRows.map((r) => {
                  const counted = propCounts[r.linenItemId] ?? 0;
                  const delta = counted - r.bookQty;
                  return (
                    <CounterRow
                      key={r.linenItemId}
                      name={r.name}
                      meta={<DeltaMeta book={r.bookQty} delta={delta} />}
                      value={counted}
                      onChange={(next) =>
                        setPropCounts((prev) => ({
                          ...prev,
                          [r.linenItemId]: next,
                        }))
                      }
                    />
                  );
                })}
              </CounterList>
            )}
          </section>

          <section aria-label="Still with the laundry">
            <div className="px-1 pb-2 pt-2">
              <h2 className="text-base font-bold">
                2 · Still with the laundry
              </h2>
              <p className="text-sm text-muted-foreground">
                Ask each laundry how much they are actually holding, and put
                that number here.
              </p>
            </div>

            {hasWrongVendorBook ? (
              <HelpNote tone="warn" className="mb-3">
                Minus figures are impossible — they mean wrong entries were
                saved. Put the real count; the app will fix the difference.
              </HelpNote>
            ) : null}

            {vendorGroups.length === 0 ? (
              <div className="surface rounded-2xl p-4 text-center text-sm text-muted-foreground">
                The book says nothing is with any laundry right now.
              </div>
            ) : (
              <div className="space-y-4">
                {vendorGroups.map((g) => (
                  <div key={g.vendorId}>
                    <h3 className="px-1 pb-1.5 text-sm font-bold text-muted-foreground">
                      {g.vendorName}
                    </h3>
                    <CounterList>
                      {g.rows.map((r) => {
                        const key = `${r.vendorId}:${r.linenItemId}`;
                        const counted = vendCounts[key] ?? 0;
                        const delta = counted - r.bookQty;
                        return (
                          <CounterRow
                            key={key}
                            name={r.itemName}
                            meta={<DeltaMeta book={r.bookQty} delta={delta} />}
                            value={counted}
                            onChange={(next) =>
                              setVendCounts((prev) => ({
                                ...prev,
                                [key]: next,
                              }))
                            }
                          />
                        );
                      })}
                    </CounterList>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-2 pt-1">
            <label
              htmlFor="reset-note"
              className="px-1 text-sm font-medium text-muted-foreground"
            >
              Why this fresh start? (optional, shows in the register)
            </label>
            <Textarea
              id="reset-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="rounded-xl text-base"
              placeholder="e.g. pending had gone wrong, recounted with Datta"
            />
          </div>

          {ctx.history.length ? (
            <section aria-label="Past fresh starts" className="pt-2">
              <h2 className="px-1 pb-2 text-sm font-bold text-muted-foreground">
                Past fresh starts
              </h2>
              <div className="surface divide-y divide-border rounded-2xl">
                {ctx.history.map((h) => (
                  <Link
                    key={h.transactionId}
                    href={`/app/txns/${h.transactionId}`}
                    className="press-soft flex min-h-14 items-center gap-3 px-4 py-3"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <Eraser className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold">
                        {fmtDate(h.occurredAt)}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {h.byName ? `by ${h.byName} · ` : ""}
                        {h.entryCount}{" "}
                        {h.entryCount === 1 ? "number" : "numbers"} corrected
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {propertyId && ctx ? (
        <StickyBar>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div
                data-numeric
                className={cn(
                  "text-2xl font-bold leading-tight",
                  differences.length > 0 && "text-soiled"
                )}
              >
                {differences.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {differences.length === 1
                  ? "number will be corrected"
                  : "numbers will be corrected"}
              </div>
            </div>
            <Button
              size="xl"
              className="flex-1"
              onClick={() => setReviewOpen(true)}
            >
              Review &amp; start fresh
            </Button>
          </div>
        </StickyBar>
      ) : null}

      <Drawer open={reviewOpen} onOpenChange={setReviewOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Start fresh?</DrawerTitle>
            <DrawerDescription>
              {propertyName}. The book gets corrected to your counted numbers,
              and everything continues from there. This is saved in the
              register for everyone to see.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="px-5">
            {differences.length === 0 ? (
              <div className="flex items-center gap-2.5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-clean-soft">
                  <Check className="size-5 text-clean" />
                </span>
                <p className="text-base text-muted-foreground">
                  Your count matches the book everywhere — nothing needs
                  fixing. You can still save it to put the check on record.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {differences.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium">
                        {d.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Book says {d.book} → real count {d.counted}
                      </div>
                    </div>
                    <span
                      data-numeric
                      className={cn(
                        "rounded-full px-2.5 py-1 text-sm font-bold",
                        d.counted - d.book > 0
                          ? "bg-clean-soft text-clean"
                          : "bg-damaged-soft text-damaged"
                      )}
                    >
                      {d.counted - d.book > 0 ? "+" : ""}
                      {d.counted - d.book}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DrawerBody>

          <DrawerFooter className="space-y-2">
            <Button
              size="xl"
              className="w-full"
              disabled={saving}
              onClick={onConfirm}
            >
              {saving ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Starting fresh…
                </>
              ) : (
                "Yes, start fresh"
              )}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled={saving}
              onClick={() => setReviewOpen(false)}
            >
              Go back and check
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function DeltaMeta({ book, delta }: { book: number; delta: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn(book < 0 && "font-semibold text-damaged")}>
        Book: {book}
        {book < 0 ? " (wrong)" : ""}
      </span>
      {delta !== 0 ? (
        <span
          data-numeric
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold",
            delta > 0
              ? "bg-clean-soft text-clean"
              : "bg-damaged-soft text-damaged"
          )}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      ) : null}
    </span>
  );
}
