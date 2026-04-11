"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { PhysicalStockCountStatus } from "@/generated/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savePhysicalStockApprovedQuantities } from "@/actions/physicalCount/savePhysicalStockApprovedQuantities";
import { cn } from "@/lib/utils";

export type PhysicalCountAdminLine = {
  linenItemId: string;
  linenItemName: string;
  sku: string | null;
  countedQty: number;
  approvedQty: number | null;
  bookQtyAtSubmit: number;
  bookQtyNow: number | null;
  deltaStaffAtSubmit: number;
};

export function PhysicalCountAdminEditor(props: {
  countId: string;
  status: PhysicalStockCountStatus;
  lines: PhysicalCountAdminLine[];
}) {
  const router = useRouter();
  const pending = props.status === PhysicalStockCountStatus.PENDING_REVIEW;

  const [approvedById, setApprovedById] = React.useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        props.lines.map((l) => [
          l.linenItemId,
          l.approvedQty ?? l.countedQty,
        ])
      )
  );

  React.useEffect(() => {
    setApprovedById(
      Object.fromEntries(
        props.lines.map((l) => [
          l.linenItemId,
          l.approvedQty ?? l.countedQty,
        ])
      )
    );
  }, [props.lines]);

  const [saving, setSaving] = React.useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const r = await savePhysicalStockApprovedQuantities({
        countId: props.countId,
        lines: props.lines.map((l) => ({
          linenItemId: l.linenItemId,
          approvedQty: approvedById[l.linenItemId] ?? l.countedQty,
        })),
      });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success("Approved quantities saved.");
      router.refresh();
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function effectiveNow(l: PhysicalCountAdminLine): number {
    if (!pending) return l.approvedQty ?? l.countedQty;
    return approvedById[l.linenItemId] ?? l.countedQty;
  }

  function deltaVsNow(l: PhysicalCountAdminLine): number | null {
    if (l.bookQtyNow === null) return null;
    return effectiveNow(l) - l.bookQtyNow;
  }

  return (
    <Card className="overflow-hidden rounded-2xl border p-0">
      <div className="border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {pending ? (
          <>
            Edit <strong>Approved</strong> if the staff total should differ before
            you approve. Only <strong>clean store · CLEAN</strong> is adjusted;
            vendor / in-laundry buckets stay as booked.
          </>
        ) : (
          <>
            Final figures: <strong>Approved</strong> (or staff count if not edited)
            is what the ledger was aligned to.
          </>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 text-right font-medium">Staff</th>
              <th className="px-3 py-2 text-right font-medium">Approved</th>
              <th className="px-3 py-2 text-right font-medium">Book @ submit</th>
              {pending ? (
                <th className="px-3 py-2 text-right font-medium">Book now</th>
              ) : null}
              {pending ? (
                <th className="px-3 py-2 text-right font-medium">
                  Δ approved vs now
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {props.lines.map((l) => {
              const d = deltaVsNow(l);
              return (
                <tr key={l.linenItemId} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-medium">{l.linenItemName}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.sku ?? "—"}
                      {l.deltaStaffAtSubmit !== 0 ? (
                        <span className="ml-2 text-muted-foreground">
                          (staff Δ @ submit:{" "}
                          {l.deltaStaffAtSubmit > 0
                            ? `+${l.deltaStaffAtSubmit}`
                            : l.deltaStaffAtSubmit}
                          )
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {l.countedQty}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {pending ? (
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        className="ml-auto h-9 w-[88px] rounded-xl text-right font-mono tabular-nums"
                        value={String(
                          approvedById[l.linenItemId] ?? l.countedQty
                        )}
                        onChange={(e) => {
                          const v = e.target.value;
                          const n = parseInt(v, 10);
                          setApprovedById((prev) => ({
                            ...prev,
                            [l.linenItemId]: Number.isFinite(n)
                              ? Math.max(0, n)
                              : 0,
                          }));
                        }}
                      />
                    ) : (
                      <span className="font-mono tabular-nums">
                        {l.approvedQty ?? l.countedQty}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {l.bookQtyAtSubmit}
                  </td>
                  {pending ? (
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {l.bookQtyNow ?? "—"}
                    </td>
                  ) : null}
                  {pending ? (
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-mono tabular-nums font-medium",
                        d === null && "text-muted-foreground",
                        (d ?? 0) > 0 && "text-emerald-700 dark:text-emerald-400",
                        (d ?? 0) < 0 && "text-destructive"
                      )}
                    >
                      {d === null
                        ? "—"
                        : d > 0
                          ? `+${d}`
                          : String(d)}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pending ? (
        <div className="flex justify-end border-t p-3">
          <Button
            type="button"
            variant="secondary"
            className="rounded-2xl"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save approved quantities"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
