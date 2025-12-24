"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/mobile/PageHeader";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { ItemPickerSheet } from "@/components/mobile/ItemPickerSheet";
import { QtyStepper } from "@/components/mobile/QtyStepper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useSubmitAction, newIdempotencyKey } from "@/hooks/useSubmitAction";

// Thread D action
import {
  dispatchToLaundry,
  DispatchToLaundrySchema,
} from "@/actions/transactions";

const LS_PROPERTY = "laundry:lastPropertyId";
const LS_VENDOR = "laundry:lastVendorId:dispatch";

type Line = { linenItemId: string; qty: number };

export default function DispatchPage() {
  const boot = useBootstrap();

  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [vendorId, setVendorId] = React.useState<string | null>(null);
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

  React.useEffect(() => {
    if (!boot.data?.vendors?.length) return;
    const saved = localStorage.getItem(LS_VENDOR);
    if (saved && boot.data.vendors.some((v) => v.id === saved))
      setVendorId(saved);
  }, [boot.data?.vendors]);

  const selectedIds = React.useMemo(
    () => new Set(lines.map((l) => l.linenItemId)),
    [lines]
  );

  const totalQty = React.useMemo(
    () => lines.reduce((s, l) => s + (l.qty || 0), 0),
    [lines]
  );

  const { isSubmitting, submit } = useSubmitAction(dispatchToLaundry as any, {
    successTitle: "Dispatch saved",
    errorTitle: "Dispatch failed",
  });

  const canSubmit = !!propertyId && !!vendorId && totalQty > 0 && !isSubmitting;

  const onAddItem = (id: string) => {
    setLines((prev) => [...prev, { linenItemId: id, qty: 0 }]);
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

    // light UI-side validation using Thread D schema (if shape differs, adjust mapping here)
    const parsed = DispatchToLaundrySchema.safeParse(payload as any);
    if (!parsed.success) return; // server toast will handle real errors; keep UI simple

    const res = await submit(parsed.data as any);
    if (res?.ok) setDone(true);
  };

  const propertyOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const vendorOptions =
    boot.data?.vendors.map((v) => ({ value: v.id, label: v.name })) ?? [];
  const items = boot.data?.items ?? [];

  console.log("propertyOptions", propertyOptions);

  return (
    <div className="">
      <PageHeader title="Dispatch" />

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

        {done ? (
          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                Dispatch saved
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                You can start a new dispatch.
              </div>
              <Button
                className="mt-4 h-12 w-full rounded-2xl"
                onClick={onReset}
              >
                New Dispatch
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
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

            <div className="space-y-3">
              {lines.map((l) => {
                const item = items.find((i) => i.id === l.linenItemId);
                return (
                  <Card key={l.linenItemId} className="rounded-3xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {item?.name ?? "Item"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Soiled qty
                          </div>
                        </div>
                        <QtyStepper
                          value={l.qty}
                          onChange={(next) =>
                            setLines((prev) =>
                              prev.map((x) =>
                                x.linenItemId === l.linenItemId
                                  ? { ...x, qty: next }
                                  : x
                              )
                            )
                          }
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-3 h-10 w-full rounded-2xl text-muted-foreground"
                        onClick={() =>
                          setLines((prev) =>
                            prev.filter((x) => x.linenItemId !== l.linenItemId)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>

      {!done && (
        <StickyBar>
          <div className="flex items-center justify-between pb-2 text-sm">
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold">{totalQty}</div>
          </div>
          <Button
            className="h-12 w-full rounded-2xl"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            Submit Dispatch
          </Button>
        </StickyBar>
      )}
    </div>
  );
}
