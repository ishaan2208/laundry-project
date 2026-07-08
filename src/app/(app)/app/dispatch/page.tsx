"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/mobile/PageHeader";
import { HelpNote } from "@/components/mobile/HelpNote";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { CounterList, CounterRow } from "@/components/mobile/CounterList";
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
import { dispatchToLaundry } from "@/actions/transactions";
import { DispatchToLaundrySchema } from "@/actions/transactions/schemas.client";
import { useProperty } from "@/components/PropertyProvider";
import { getPendingItemsForVendor } from "@/actions/ui/getPendingItemsForVendor";
import { getLastVendorForProperty } from "@/actions/ui/getLastVendorForProperty";
import { buildSentStory } from "@/lib/laundryStory";
import { ShareUpdate } from "@/components/mobile/ShareUpdate";

const LS_VENDOR = "laundry:lastVendorId:dispatch";
const LS_ITEM_FREQ = "laundry:itemFreq:dispatch";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
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

export default function SendToLaundryPage() {
  const boot = useBootstrap();
  const router = useRouter();
  const { propertyId: appPropertyId, selectProperty } = useProperty();

  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [vendorId, setVendorId] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState<Record<string, number>>({});
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

  // Default the laundry so staff rarely pick it. Instant hint from this
  // device's last send, then the hotel's real last send/receive vendor
  // (server) takes over — works on a new phone or for a different person.
  // A manual choice always wins and is not overridden.
  const vendorTouched = React.useRef(false);

  React.useEffect(() => {
    // New hotel → its vendor should re-default, not carry over.
    vendorTouched.current = false;
    setVendorId(null);
  }, [propertyId]);

  React.useEffect(() => {
    if (!boot.data?.vendors?.length || vendorTouched.current || vendorId)
      return;
    const saved = localStorage.getItem(LS_VENDOR);
    if (saved && boot.data.vendors.some((v) => v.id === saved)) {
      setVendorId(saved);
    } else if (boot.data.vendors.length === 1) {
      setVendorId(boot.data.vendors[0].id);
    }
  }, [boot.data?.vendors, vendorId]);

  React.useEffect(() => {
    if (!propertyId || !boot.data?.vendors?.length) return;
    let cancelled = false;
    (async () => {
      const res = await getLastVendorForProperty({ propertyId });
      if (cancelled || !res.ok || !res.vendorId || vendorTouched.current)
        return;
      if (boot.data?.vendors.some((v) => v.id === res.vendorId)) {
        setVendorId(res.vendorId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId, boot.data?.vendors]);

  // Most-used items float to the top; order is fixed for the session
  // so rows never jump while counting.
  const items = React.useMemo(() => {
    const all = boot.data?.items ?? [];
    const freq = readJson<Record<string, number>>(LS_ITEM_FREQ, {});
    return [...all].sort(
      (a, b) =>
        (freq[b.id] ?? 0) - (freq[a.id] ?? 0) || a.name.localeCompare(b.name)
    );
  }, [boot.data?.items]);

  const totalQty = React.useMemo(
    () => Object.values(qty).reduce((s, n) => s + (n || 0), 0),
    [qty]
  );
  const countedItems = React.useMemo(
    () => items.filter((it) => (qty[it.id] ?? 0) > 0),
    [items, qty]
  );

  const { isSubmitting, submit } = useSubmitAction(dispatchToLaundry, {
    successTitle: "Saved in the register",
    errorTitle: "Could not save",
  });

  const propertyOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const vendorOptions =
    boot.data?.vendors.map((v) => ({ value: v.id, label: v.name })) ?? [];
  const vendorName =
    vendorOptions.find((o) => o.value === vendorId)?.label ?? "";

  const canReview = !!propertyId && !!vendorId && totalQty > 0 && !isSubmitting;

  const onConfirm = async () => {
    if (!propertyId || !vendorId) return;
    selectProperty(propertyId);
    localStorage.setItem(LS_VENDOR, vendorId);

    const lines = countedItems.map((it) => ({
      linenItemId: it.id,
      qty: qty[it.id],
    }));

    const parsed = DispatchToLaundrySchema.safeParse({
      propertyId,
      vendorId,
      idempotencyKey: newIdempotencyKey(),
      lines,
    });
    if (!parsed.success) return;

    const res = await submit(parsed.data);
    if (res?.ok) {
      // Remember what was sent so next time those items are on top.
      const freq = readJson<Record<string, number>>(LS_ITEM_FREQ, {});
      for (const l of lines) freq[l.linenItemId] = (freq[l.linenItemId] ?? 0) + 1;
      writeJson(LS_ITEM_FREQ, freq);

      setReviewOpen(false);
      setDoneSummary({
        total: totalQty,
        vendorName,
        time: formatNowTime(),
        story: null,
      });

      // Build the WhatsApp story with the vendor's balance AFTER this entry.
      const propertyName =
        propertyOptions.find((o) => o.value === propertyId)?.label ?? "";
      const sentLines = countedItems.map((it) => ({
        name: it.name,
        qty: qty[it.id],
      }));
      const itemNames = new Map(items.map((it) => [it.id, it.name]));
      const pend = await getPendingItemsForVendor({ propertyId, vendorId });
      const story = buildSentStory({
        propertyName,
        when: new Date(),
        lines: sentLines,
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
        title="Sent to laundry"
        summary={`${doneSummary.total} pieces to ${doneSummary.vendorName}`}
        detail={`Today, ${doneSummary.time} · saved in the register`}
        primaryLabel="Done"
        onPrimary={() => router.push("/app")}
        secondaryLabel="Send more"
        onSecondary={() => {
          setQty({});
          setDoneSummary(null);
        }}
      >
        <ShareUpdate text={doneSummary.story} className="mt-7" />
      </SuccessScreen>
    );
  }

  const noProperty = !boot.loading && boot.data?.properties?.length === 0;

  return (
    <div className="min-h-dvh bg-background pb-40">
      <PageHeader title="Send to laundry" subtitle="Dirty linen going out" />

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
                hint="Where is this linen from?"
                leadingIcon="building"
              />
            ) : null}

            <BottomSheetSelect
              label="Laundry"
              value={vendorId}
              options={vendorOptions}
              onChange={(v) => {
                vendorTouched.current = true;
                setVendorId(v);
              }}
              placeholder="Choose laundry"
              hint="Who is taking the linen?"
              disabled={!propertyId}
              leadingIcon="truck"
            />

            <HelpNote>
              Count the dirty linen you are handing over. It stays in{" "}
              {vendorName ? `${vendorName}'s` : "the laundry's"} account until
              they bring it back washed.
            </HelpNote>

            <section aria-label="Count the linen">
              <div className="flex items-baseline justify-between px-1 pb-2 pt-1">
                <h2 className="text-base font-bold">How many of each?</h2>
                <span className="text-sm text-muted-foreground">
                  Today, {formatToday()}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="surface rounded-2xl p-5 text-center">
                  <p className="text-base font-semibold">No linen items yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your admin needs to add items like bedsheets and towels
                    first.
                  </p>
                </div>
              ) : (
                <CounterList>
                  {items.map((it) => (
                    <CounterRow
                      key={it.id}
                      name={it.name}
                      meta={it.unit ?? undefined}
                      value={qty[it.id] ?? 0}
                      onChange={(next) =>
                        setQty((prev) => ({ ...prev, [it.id]: next }))
                      }
                      disabled={!vendorId}
                    />
                  ))}
                </CounterList>
              )}
            </section>
          </>
        )}
      </main>

      {!noProperty && (
        <StickyBar>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div data-numeric className="text-2xl font-bold leading-tight">
                {totalQty}
              </div>
              <div className="text-xs text-muted-foreground">
                {totalQty === 0
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
              Review &amp; send
            </Button>
          </div>
        </StickyBar>
      )}

      {/* Read-back confirmation: the last chance to catch a wrong count. */}
      <Drawer open={reviewOpen} onOpenChange={setReviewOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Ready to send?</DrawerTitle>
            <DrawerDescription>
              To {vendorName || "laundry"} · Today, {formatToday()}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="px-5">
            <ul className="divide-y divide-border">
              {countedItems.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="min-w-0 truncate text-base font-medium">
                    {it.name}
                  </span>
                  <span data-numeric className="text-base font-bold">
                    {qty[it.id]}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t-2 border-foreground/10 py-3">
              <span className="text-base font-bold">Total</span>
              <span data-numeric className="text-lg font-bold">
                {totalQty}
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
                `Yes, send ${totalQty} pieces`
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
