"use client";

import * as React from "react";
import { PageHeader } from "@/components/mobile/PageHeader";
import { StickyBar } from "@/components/mobile/StickyBar";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { ItemPickerSheet } from "@/components/mobile/ItemPickerSheet";
import { QtyStepper } from "@/components/mobile/QtyStepper";
import { InlineField } from "@/components/mobile/InlineField";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useSubmitAction, newIdempotencyKey } from "@/hooks/useSubmitAction";

// Thread D action
import { discardLost } from "@/actions/transactions";
import { DiscardLostSchema } from "@/actions/transactions/schemas.client";

const LS_PROPERTY = "laundry:lastPropertyId";

type Line = { linenItemId: string; qty: number };

export default function DiscardPage() {
  const boot = useBootstrap();

  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [source, setSource] = React.useState<
    "DAMAGED_BIN" | "CLEAN_STORE" | "SOILED_STORE" | "REWASH_BIN"
  >("DAMAGED_BIN");
  const [lines, setLines] = React.useState<Line[]>([]);

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

  const { isSubmitting, submit } = useSubmitAction(discardLost as any, {
    successTitle: "Discard saved",
    errorTitle: "Discard failed",
  });

  const canSubmit = !!propertyId && totalQty > 0 && !isSubmitting;

  const onSubmit = async () => {
    if (!propertyId) return;
    localStorage.setItem(LS_PROPERTY, propertyId);

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
    if (res?.ok) {
      setReason("");
      setLines([]);
      setSource("DAMAGED_BIN");
    }
  };

  const propertyOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];

  return (
    <div className="min-h-dvh">
      <PageHeader title="Discard / Damage" />

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
          label="Source"
          value={source}
          onChange={(v) => setSource(v as any)}
          options={[
            { value: "DAMAGED_BIN", label: "Damaged Bin (default)" },
            { value: "REWASH_BIN", label: "Rewash Bin" },
            { value: "SOILED_STORE", label: "Soiled Store" },
            { value: "CLEAN_STORE", label: "Clean Store" },
          ]}
        />

        <InlineField label="Reason (short)">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. torn, stained, missing..."
            className="min-h-21 rounded-2xl"
          />
        </InlineField>

        <ItemPickerSheet
          title="Add linen items"
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            subtitle: i.unit ?? undefined,
          }))}
          selectedIds={selectedIds}
          onAdd={(id) =>
            setLines((prev) => [...prev, { linenItemId: id, qty: 0 }])
          }
          disabled={boot.loading || !propertyId}
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
                        Qty to discard
                      </div>
                    </div>
                    <QtyStepper
                      value={l.qty}
                      onChange={(v) =>
                        setLines((prev) =>
                          prev.map((x) =>
                            x.linenItemId === l.linenItemId
                              ? { ...x, qty: v }
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
      </main>

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
          Submit Discard
        </Button>
      </StickyBar>
    </div>
  );
}
