"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPhysicalStockCount } from "@/actions/physicalCount/submitPhysicalStockCount";
import { ClipboardList } from "lucide-react";

type Row = {
  linenItemId: string;
  name: string;
  sku: string | null;
  bookQty: number;
};

export function PhysicalCountFormClient(props: {
  propertyId: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
  initialRows: Row[];
}) {
  const router = useRouter();
  const [qty, setQty] = React.useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const r of props.initialRows) {
      m[r.linenItemId] = r.bookQty;
    }
    return m;
  });
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    const m: Record<string, number> = {};
    for (const r of props.initialRows) {
      m[r.linenItemId] = r.bookQty;
    }
    setQty(m);
  }, [props.initialRows]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const lines = props.initialRows.map((r) => ({
        linenItemId: r.linenItemId,
        countedQty: qty[r.linenItemId] ?? 0,
      }));
      const res = await submitPhysicalStockCount({
        propertyId: props.propertyId,
        includeVendor: props.includeVendor,
        includeDiscarded: props.includeDiscarded,
        staffNote: note.trim() || undefined,
        lines,
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Submitted for admin review.");
      router.push(`/app/stock/physical-count/status/${res.id}`);
    } catch {
      toast.error("Submit failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card className="rounded-3xl border border-violet-200/60 bg-amber-50/40 p-4 text-sm dark:border-violet-500/15 dark:bg-amber-950/20">
        <div className="flex gap-2 font-medium text-amber-950 dark:text-amber-100">
          <ClipboardList className="h-5 w-5 shrink-0" />
          <div>
            Enter the <strong>total pieces</strong> you physically have for each
            item (same scope as the filters: all buckets included or excluded).
            When an admin approves, the system updates the ledger so{" "}
            <strong>property-wide totals</strong> match your numbers. Variances
            are posted to <strong>Clean store · CLEAN</strong> so totals align.
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="staffNote">Note to admin (optional)</Label>
        <Textarea
          id="staffNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="rounded-2xl"
          placeholder="e.g. Counted after monthly room audit…"
        />
      </div>

      <div className="grid gap-2">
        {props.initialRows.map((r) => (
          <Card
            key={r.linenItemId}
            className="rounded-2xl border border-violet-200/50 p-3 dark:border-violet-500/15"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium leading-tight">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  Book total (now): {r.bookQty}
                  {r.sku ? ` · SKU ${r.sku}` : ""}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  Your count
                </Label>
                <Input
                  type="number"
                  min={0}
                  className="h-11 w-28 rounded-xl font-mono tabular-nums"
                  value={String(qty[r.linenItemId] ?? 0)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setQty((prev) => ({
                      ...prev,
                      [r.linenItemId]: Number.isFinite(v) ? Math.max(0, v) : 0,
                    }));
                  }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-2xl bg-violet-600 hover:bg-violet-600/90"
      >
        {pending ? "Submitting…" : "Submit for admin approval"}
      </Button>
    </form>
  );
}
