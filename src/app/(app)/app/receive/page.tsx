"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { PageHeader } from "@/components/mobile/PageHeader";
import { HelpNote } from "@/components/mobile/HelpNote";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { CounterList, CounterRow } from "@/components/mobile/CounterList";
import { QtyStepper } from "@/components/mobile/QtyStepper";
import { StatusPill } from "@/components/mobile/StatusPill";
import { SuccessScreen } from "@/components/mobile/SuccessScreen";
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

import { useBootstrap } from "@/hooks/useBootstrap";
import { useSubmitAction, newIdempotencyKey } from "@/hooks/useSubmitAction";
import { getPendingItemsForVendor } from "@/actions/ui/getPendingItemsForVendor";
import { receiveFromLaundry } from "@/actions/transactions";
import { ReceiveFromLaundrySchema } from "@/actions/transactions/schemas.client";
import { useProperty } from "@/components/PropertyProvider";
import { buildReceivedStory } from "@/lib/laundryStory";
import { ShareUpdate } from "@/components/mobile/ShareUpdate";

const LS_VENDOR = "laundry:lastVendorId:receive";

type Counts = { clean: number; damaged: number; rewash: number };
const zero: Counts = { clean: 0, damaged: 0, rewash: 0 };

function formatToday() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

function formatNowTime() {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

export default function ReceiveFromLaundryPage() {
  const boot = useBootstrap();
  const router = useRouter();
  const { propertyId: appPropertyId, selectProperty } = useProperty();

  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [vendorId, setVendorId] = React.useState<string | null>(null);

  const [pendingLoading, setPendingLoading] = React.useState(false);
  const [pendingMap, setPendingMap] = React.useState<Record<string, number>>(
    {}
  );

  const [counts, setCounts] = React.useState<Record<string, Counts>>({});
  const [extrasOpen, setExtrasOpen] = React.useState<Record<string, boolean>>(
    {}
  );
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [doneSummary, setDoneSummary] = React.useState<{
    total: number;
    vendorName: string;
    time: string;
    story: string | null;
  } | null>(null);

  // App-wide selection, falling back to the first accessible hotel.
  React.useEffect(() => {
    if (!boot.data?.properties?.length) return;
    const first = boot.data.properties[0].id;
    setPropertyId(
      appPropertyId && boot.data.properties.some((p) => p.id === appPropertyId)
        ? appPropertyId
        : first
    );
  }, [boot.data?.properties, appPropertyId]);

  React.useEffect(() => {
    if (!boot.data?.vendors?.length) return;
    const saved = localStorage.getItem(LS_VENDOR);
    if (saved && boot.data.vendors.some((v) => v.id === saved)) {
      setVendorId(saved);
    } else if (boot.data.vendors.length === 1) {
      setVendorId(boot.data.vendors[0].id);
    }
  }, [boot.data?.vendors]);

  // What this laundry still holds — drives the "waiting to come back" list.
  React.useEffect(() => {
    if (!propertyId || !vendorId) return;
    let cancelled = false;

    setPendingLoading(true);
    setPendingMap({});
    setCounts({});
    setExtrasOpen({});

    (async () => {
      const res = await getPendingItemsForVendor({ propertyId, vendorId });
      if (cancelled) return;
      if (res.ok) {
        const map: Record<string, number> = {};
        for (const r of res.rows) map[r.linenItemId] = r.totalPending;
        setPendingMap(map);
      }
      setPendingLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [propertyId, vendorId]);

  const items = React.useMemo(() => boot.data?.items ?? [], [boot.data]);

  const pendingItems = React.useMemo(
    () =>
      items
        .filter((it) => (pendingMap[it.id] ?? 0) > 0)
        .sort((a, b) => (pendingMap[b.id] ?? 0) - (pendingMap[a.id] ?? 0)),
    [items, pendingMap]
  );
  const otherItems = React.useMemo(
    () =>
      items
        .filter((it) => (pendingMap[it.id] ?? 0) <= 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [items, pendingMap]
  );
  const [showOthers, setShowOthers] = React.useState(false);

  const rowTotal = (c?: Counts) =>
    (c?.clean ?? 0) + (c?.damaged ?? 0) + (c?.rewash ?? 0);

  const totalEntered = React.useMemo(
    () => Object.values(counts).reduce((s, c) => s + rowTotal(c), 0),
    [counts]
  );
  const totalPending = React.useMemo(
    () => Object.values(pendingMap).reduce((s, n) => s + n, 0),
    [pendingMap]
  );
  const countedItems = React.useMemo(
    () => items.filter((it) => rowTotal(counts[it.id]) > 0),
    [items, counts]
  );

  const { isSubmitting, submit } = useSubmitAction(receiveFromLaundry, {
    successTitle: "Saved in the register",
    errorTitle: "Could not save",
  });

  const propertyOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const vendorOptions =
    boot.data?.vendors.map((v) => ({ value: v.id, label: v.name })) ?? [];
  const vendorName =
    vendorOptions.find((o) => o.value === vendorId)?.label ?? "";

  const canReview =
    !!propertyId && !!vendorId && totalEntered > 0 && !isSubmitting;

  const setCount = (id: string, patch: Partial<Counts>) =>
    setCounts((prev) => ({ ...prev, [id]: { ...zero, ...prev[id], ...patch } }));

  const onConfirm = async () => {
    if (!propertyId || !vendorId) return;
    selectProperty(propertyId);
    localStorage.setItem(LS_VENDOR, vendorId);

    const parsed = ReceiveFromLaundrySchema.safeParse({
      propertyId,
      vendorId,
      idempotencyKey: newIdempotencyKey(),
      lines: countedItems.map((it) => ({
        linenItemId: it.id,
        receivedCleanQty: counts[it.id]?.clean ?? 0,
        damagedQty: counts[it.id]?.damaged ?? 0,
        rewashQty: counts[it.id]?.rewash ?? 0,
      })),
    });
    if (!parsed.success) return;

    const res = await submit(parsed.data);
    if (res?.ok) {
      setReviewOpen(false);
      setDoneSummary({
        total: totalEntered,
        vendorName,
        time: formatNowTime(),
        story: null,
      });

      // Build the WhatsApp story with the vendor's balance AFTER this entry.
      const propertyName =
        propertyOptions.find((o) => o.value === propertyId)?.label ?? "";
      const receivedLines = countedItems.map((it) => {
        const c = counts[it.id] ?? zero;
        return {
          name: it.name,
          clean: c.clean,
          damaged: c.damaged,
          rewash: c.rewash,
        };
      });
      const itemNames = new Map(items.map((it) => [it.id, it.name]));
      const pend = await getPendingItemsForVendor({ propertyId, vendorId });
      const story = buildReceivedStory({
        propertyName,
        when: new Date(),
        lines: receivedLines,
        pendingLines: pend.ok
          ? pend.rows.map((r) => ({
              name: itemNames.get(r.linenItemId) ?? "Item",
              qty: r.totalPending,
            }))
          : null,
      });
      setDoneSummary((prev) => (prev ? { ...prev, story } : prev));
    }
  };

  if (doneSummary) {
    return (
      <SuccessScreen
        title="Received from laundry"
        summary={`${doneSummary.total} pieces from ${doneSummary.vendorName}`}
        detail={`Today, ${doneSummary.time} · saved in the register`}
        primaryLabel="Done"
        onPrimary={() => router.push("/app")}
        secondaryLabel="Receive more"
        onSecondary={() => {
          setCounts({});
          setDoneSummary(null);
        }}
      >
        <ShareUpdate text={doneSummary.story} className="mt-7" />
      </SuccessScreen>
    );
  }

  const noProperty = !boot.loading && boot.data?.properties?.length === 0;

  const renderRow = (it: { id: string; name: string; unit?: string | null }) => {
    const pending = pendingMap[it.id] ?? 0;
    const c = counts[it.id] ?? zero;
    const entered = rowTotal(c);
    const over = pending > 0 && entered > pending;
    const hasExtras = extrasOpen[it.id] || c.damaged > 0 || c.rewash > 0;

    return (
      <CounterRow
        key={it.id}
        name={it.name}
        meta={
          pending > 0 ? (
            <span className="inline-flex items-center gap-2">
              <span>{pending} still out</span>
              {c.clean !== pending ? (
                <button
                  type="button"
                  onClick={() => setCount(it.id, { clean: pending })}
                  className="press rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground"
                >
                  All {pending} back
                </button>
              ) : null}
            </span>
          ) : (
            it.unit ?? undefined
          )
        }
        value={c.clean}
        onChange={(next) => setCount(it.id, { clean: next })}
        disabled={!vendorId}
        extra={
          <div className="mt-1">
            {over ? (
              <p className="mb-1 text-sm font-medium text-soiled">
                That is more than the {pending} sent — please check.
              </p>
            ) : null}

            {hasExtras ? (
              <div className="space-y-2 rounded-xl bg-muted/60 p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <StatusPill condition="DAMAGED" />
                  <QtyStepper
                    value={c.damaged}
                    onChange={(v) => setCount(it.id, { damaged: v })}
                    label={`${it.name} damaged`}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <StatusPill condition="REWASH">Wash again</StatusPill>
                  <QtyStepper
                    value={c.rewash}
                    onChange={(v) => setCount(it.id, { rewash: v })}
                    label={`${it.name} to wash again`}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setExtrasOpen((prev) => ({ ...prev, [it.id]: true }))
                }
                className="press inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-sm font-medium text-muted-foreground"
              >
                <Plus className="size-4" />
                Damaged or wash again?
              </button>
            )}
          </div>
        }
      />
    );
  };

  return (
    <div className="min-h-dvh bg-background pb-40">
      <PageHeader
        title="Receive from laundry"
        subtitle="Clean linen coming back"
      />

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pt-4">
        {noProperty ? (
          <div className="surface rounded-2xl p-5 text-center">
            <p className="text-base font-semibold">No hotel assigned yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask your manager to add you to a hotel.
            </p>
          </div>
        ) : boot.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {propertyOptions.length > 1 ? (
              <BottomSheetSelect
                label="Hotel"
                value={propertyId}
                options={propertyOptions}
                onChange={(v) => {
                  setPropertyId(v);
                  selectProperty(v);
                }}
                placeholder="Choose hotel"
                hint="Which hotel is this linen for?"
                leadingIcon="building"
              />
            ) : null}

            <BottomSheetSelect
              label="Laundry"
              value={vendorId}
              options={vendorOptions}
              onChange={setVendorId}
              placeholder="Choose laundry"
              hint="Who brought the linen back?"
              disabled={!propertyId}
              leadingIcon="truck"
            />

            {!vendorId ? null : pendingLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : (
              <>
                <HelpNote>
                  Count what {vendorName || "the laundry"} brought back.
                  &ldquo;Still out&rdquo; is what they have not returned yet.
                </HelpNote>
                <section aria-label="Waiting to come back">
                  <div className="flex items-baseline justify-between px-1 pb-2 pt-1">
                    <h2 className="text-base font-bold">
                      Waiting to come back
                    </h2>
                    <span
                      data-numeric
                      className="text-sm font-semibold text-soiled"
                    >
                      {totalPending} out
                    </span>
                  </div>

                  {pendingItems.length === 0 ? (
                    <div className="surface rounded-2xl p-5 text-center">
                      <p className="text-base font-semibold">
                        Nothing is out with {vendorName || "this laundry"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        If they brought something anyway, add it from the list
                        below.
                      </p>
                    </div>
                  ) : (
                    <CounterList>{pendingItems.map(renderRow)}</CounterList>
                  )}
                </section>

                {otherItems.length > 0 ? (
                  <section aria-label="Other items">
                    {showOthers ? (
                      <>
                        <div className="px-1 pb-2 pt-1">
                          <h2 className="text-base font-bold">Other items</h2>
                        </div>
                        <CounterList>{otherItems.map(renderRow)}</CounterList>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowOthers(true)}
                        className="surface press flex min-h-14 w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-base font-semibold text-muted-foreground"
                      >
                        <Plus className="size-5" />
                        Something else came back
                      </button>
                    )}
                  </section>
                ) : null}
              </>
            )}
          </>
        )}
      </main>

      {!noProperty && (
        <StickyBar>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div data-numeric className="text-2xl font-bold leading-tight">
                {totalEntered}
              </div>
              <div className="text-xs text-muted-foreground">
                {totalEntered === 0
                  ? "Nothing counted yet"
                  : `pieces · ${countedItems.length} ${
                      countedItems.length === 1 ? "item" : "items"
                    }`}
              </div>
            </div>
            <Button
              size="xl"
              className="flex-1"
              disabled={!canReview}
              onClick={() => setReviewOpen(true)}
            >
              Review &amp; save
            </Button>
          </div>
        </StickyBar>
      )}

      <Drawer open={reviewOpen} onOpenChange={setReviewOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Everything counted?</DrawerTitle>
            <DrawerDescription>
              From {vendorName || "laundry"} · Today, {formatToday()}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="px-5">
            <ul className="divide-y divide-border">
              {countedItems.map((it) => {
                const c = counts[it.id] ?? zero;
                return (
                  <li key={it.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-base font-medium">
                        {it.name}
                      </span>
                      <span data-numeric className="text-base font-bold">
                        {rowTotal(c)}
                      </span>
                    </div>
                    {c.damaged > 0 || c.rewash > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {c.clean > 0 ? (
                          <StatusPill condition="CLEAN">
                            Clean {c.clean}
                          </StatusPill>
                        ) : null}
                        {c.damaged > 0 ? (
                          <StatusPill condition="DAMAGED">
                            Damaged {c.damaged}
                          </StatusPill>
                        ) : null}
                        {c.rewash > 0 ? (
                          <StatusPill condition="REWASH">
                            Wash again {c.rewash}
                          </StatusPill>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t-2 border-foreground/10 py-3">
              <span className="text-base font-bold">Total received</span>
              <span data-numeric className="text-lg font-bold">
                {totalEntered}
              </span>
            </div>
          </DrawerBody>

          <DrawerFooter className="space-y-2">
            <Button
              size="xl"
              className="w-full"
              disabled={isSubmitting}
              onClick={onConfirm}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Saving…
                </>
              ) : (
                `Yes, received ${totalEntered} pieces`
              )}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => setReviewOpen(false)}
            >
              Go back and change
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
