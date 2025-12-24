"use client";

import * as React from "react";
import { PageHeader } from "@/components/mobile/PageHeader";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { ItemPickerSheet } from "@/components/mobile/ItemPickerSheet";
import { QtyStepper } from "@/components/mobile/QtyStepper";
import { StatusPill } from "@/components/mobile/StatusPill";
import { CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useSubmitAction, newIdempotencyKey } from "@/hooks/useSubmitAction";
import { getPendingItemsForVendor } from "@/actions/ui/getPendingItemsForVendor";

// Thread D action
import {
  receiveFromLaundry,
  ReceiveFromLaundrySchema,
} from "@/actions/transactions";

const LS_PROPERTY = "laundry:lastPropertyId";
const LS_VENDOR = "laundry:lastVendorId:receive";

type ReceiveLine = {
  linenItemId: string;
  cleanQty: number;
  damagedQty: number;
  rewashQty: number;
};

export default function ReceivePage() {
  const boot = useBootstrap();
  const [done, setDone] = React.useState(false);

  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [vendorId, setVendorId] = React.useState<string | null>(null);

  const [showOnlyPending, setShowOnlyPending] = React.useState(true);
  const [pendingMap, setPendingMap] = React.useState<
    Record<string, { soiled: number; rewash: number; total: number }>
  >({});

  const [lines, setLines] = React.useState<ReceiveLine[]>([]);

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

  // Load pending per vendor & prefill items list (best UX)
  React.useEffect(() => {
    if (!propertyId || !vendorId) return;
    // clear pending map while we fetch to avoid showing stale data
    setPendingMap({});
    (async () => {
      const res = await getPendingItemsForVendor({ propertyId, vendorId });
      if (!res.ok) return;

      const map: Record<
        string,
        { soiled: number; rewash: number; total: number }
      > = {};
      for (const r of res.rows)
        map[r.linenItemId] = {
          soiled: r.pendingSoiled,
          rewash: r.pendingRewash,
          total: r.totalPending,
        };
      setPendingMap(map);

      // Pre-fill lines with pending items if empty
      setLines((prev) => {
        if (prev.length) return prev;
        return res.rows.map((r) => ({
          linenItemId: r.linenItemId,
          cleanQty: 0,
          damagedQty: 0,
          rewashQty: 0,
        }));
      });
    })();
  }, [propertyId, vendorId]);

  const items = boot.data?.items ?? [];
  const selectedIds = React.useMemo(
    () => new Set(lines.map((l) => l.linenItemId)),
    [lines]
  );

  const visibleLines = React.useMemo(() => {
    if (!showOnlyPending) return lines;
    return lines.filter((l) => (pendingMap[l.linenItemId]?.total ?? 0) > 0);
  }, [lines, showOnlyPending, pendingMap]);

  const totalEntered = React.useMemo(
    () =>
      lines.reduce((s, l) => s + l.cleanQty + l.damagedQty + l.rewashQty, 0),
    [lines]
  );

  const { isSubmitting, submit } = useSubmitAction(receiveFromLaundry as any, {
    successTitle: "Receive saved",
    errorTitle: "Receive failed",
  });

  const canSubmit =
    !!propertyId && !!vendorId && totalEntered > 0 && !isSubmitting;

  const onAddItem = (id: string) =>
    setLines((prev) => [
      ...prev,
      { linenItemId: id, cleanQty: 0, damagedQty: 0, rewashQty: 0 },
    ]);

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

  const propertyOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const vendorOptions =
    boot.data?.vendors.map((v) => ({ value: v.id, label: v.name })) ?? [];

  return (
    <div className="min-h-dvh">
      <PageHeader title="Receive" />

      <main className="mx-auto w-full max-w-md space-y-4 px-3 pb-28 pt-4">
        <BottomSheetSelect
          label="Property"
          value={propertyId}
          options={propertyOptions}
          onChange={setPropertyId}
          placeholder="Select property"
          disabled={boot.loading}
        />

        <BottomSheetSelect
          label="Vendor"
          value={vendorId}
          options={vendorOptions}
          onChange={setVendorId}
          placeholder="Select vendor"
          disabled={boot.loading || !propertyId}
        />

        <div className="flex items-center justify-between rounded-2xl border px-3 py-3">
          <div className="text-sm">
            <div className="font-semibold">Show only pending</div>
            <div className="text-xs text-muted-foreground">
              Filters list by vendor pending
            </div>
          </div>
          <Switch
            checked={showOnlyPending}
            onCheckedChange={setShowOnlyPending}
          />
        </div>

        <ItemPickerSheet
          title="Add linen items"
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            subtitle: i.unit ?? undefined,
          }))}
          selectedIds={selectedIds}
          onAdd={onAddItem}
          disabled={boot.loading || !propertyId || !vendorId}
        />

        {done ? (
          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Receive saved
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                You can start a new receive.
              </div>
              <Button
                className="mt-4 h-12 w-full rounded-2xl"
                onClick={() => {
                  setLines([]);
                  setDone(false);
                }}
              >
                New Receive
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleLines.map((l) => {
              const item = items.find((i) => i.id === l.linenItemId);
              const pending = pendingMap[l.linenItemId]?.total ?? 0;

              return (
                <Card key={l.linenItemId} className="rounded-3xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {item?.name ?? "Item"}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            Pending:
                          </div>
                          <div className="rounded-full border px-2 py-0.5 text-xs">
                            {pending}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 rounded-2xl text-muted-foreground"
                        onClick={() =>
                          setLines((prev) =>
                            prev.filter((x) => x.linenItemId !== l.linenItemId)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusPill condition="CLEAN" />
                          <div className="text-sm">Clean</div>
                        </div>
                        <QtyStepper
                          value={l.cleanQty}
                          onChange={(v) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.linenItemId === l.linenItemId
                                  ? { ...x, cleanQty: v }
                                  : x
                              )
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusPill condition="DAMAGED" />
                          <div className="text-sm">Damaged</div>
                        </div>
                        <QtyStepper
                          value={l.damagedQty}
                          onChange={(v) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.linenItemId === l.linenItemId
                                  ? { ...x, damagedQty: v }
                                  : x
                              )
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusPill condition="REWASH" />
                          <div className="text-sm">Rewash</div>
                        </div>
                        <QtyStepper
                          value={l.rewashQty}
                          onChange={(v) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.linenItemId === l.linenItemId
                                  ? { ...x, rewashQty: v }
                                  : x
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <StickyBar>
        <div className="flex items-center justify-between pb-2 text-sm">
          <div className="text-muted-foreground">Total entered</div>
          <div className="font-semibold">{totalEntered}</div>
        </div>
        <Button
          className="h-12 w-full rounded-2xl"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          Submit Receive
        </Button>
      </StickyBar>
    </div>
  );
}
