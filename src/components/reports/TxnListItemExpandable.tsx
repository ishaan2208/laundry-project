"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Pencil,
  Save,
  CalendarClock,
  FileWarning,
} from "lucide-react";

import T from "react-hot-toast";
import { TxnDetailContent, TxnDetailDTO } from "./TxnDetailContent";
import { CopyTxnSummaryButton } from "./CopyTxnSummaryButton";

type TxnListRow = {
  id: string;
  type: string;
  occurredAt: string | Date;
  reference?: string | null;
  propertyName: string;
  vendorName?: string | null;
  voidedAt?: string | Date | null;
};

const minSelectableDate = new Date(2026, 0, 1); // ✅ Jan 1, 2026

function fmt(dt: string | Date) {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return format(d, "dd MMM, hh:mm a");
}

function humanType(t: string) {
  return t.replaceAll("_", " ");
}

function isMovementType(type: string) {
  return (
    type === "DISPATCH_TO_LAUNDRY" ||
    type === "RECEIVE_FROM_LAUNDRY" ||
    type === "RESEND_REWASH"
  );
}

function buildCopyModel(detail: TxnDetailDTO, row: TxnListRow) {
  return {
    id: detail.id,
    type: detail.type as any,
    occurredAt: detail.occurredAt,
    propertyName: row.propertyName ?? detail.property.name,
    vendorName: row.vendorName ?? detail.vendor?.name ?? undefined,
    reference: detail.reference ?? undefined,
    entries: detail.entries.map((e) => ({
      linenItemName: e.linenItem.name,
      condition: e.condition as any,
      qtyDelta: e.qtyDelta,
    })),
  };
}

// Allocate negative side if multiple debit lines exist (rare, but safe)
function allocateProportionally(total: number, originalAbs: number[]) {
  const sum = originalAbs.reduce((a, b) => a + b, 0);
  if (!sum) return originalAbs.map((_, i) => (i === 0 ? total : 0));

  const raw = originalAbs.map((v) => (v / sum) * total);
  const floored = raw.map((v) => Math.floor(v));
  let remainder = total - floored.reduce((a, b) => a + b, 0);

  // distribute remainder
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const out = [...floored];
  for (let k = 0; k < order.length && remainder > 0; k++) {
    out[order[k].i] += 1;
    remainder -= 1;
  }
  return out;
}

export function TxnListItemExpandable({
  row,
  admin = false,
}: {
  row: TxnListRow;
  admin?: boolean;
}) {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [detail, setDetail] = React.useState<TxnDetailDTO | null>(null);

  // admin edit (sheet)
  const [editOpen, setEditOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [occurredAtDraft, setOccurredAtDraft] = React.useState<Date | null>(
    null
  );
  const [qtyByEntryId, setQtyByEntryId] = React.useState<
    Record<string, number>
  >({});
  const [saving, setSaving] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);

  async function ensureDetail() {
    if (detail) return detail;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await fetch(`/api/txns/${row.id}`, {
        method: "GET",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message ?? "Failed to load txn.");

      setDetail(json.txn);
      return json.txn as TxnDetailDTO;
    } catch (e: any) {
      if (e?.name === "AbortError") return null;
      T.error(e?.message ?? "Failed to load transaction");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function onToggle() {
    const next = !open;
    setOpen(next);
    if (next && !detail) await ensureDetail();
  }

  async function startEdit() {
    const d = detail ?? (await ensureDetail());
    if (!d) return;

    const map: Record<string, number> = {};
    for (const e of d.entries) map[e.id] = Math.abs(e.qtyDelta);

    setQtyByEntryId(map);
    setReason("");
    setOccurredAtDraft(new Date(d.occurredAt as any));
    setEditOpen(true);
  }

  function buildUpdatesForSave(d: TxnDetailDTO) {
    // Admin edits only positive/destination lines for movement types.
    // We auto-balance negative/source lines to keep per-item net 0.

    const movement = isMovementType(d.type);

    if (!movement) {
      // Non-movement: keep your current rule (sign preserved; user edits abs)
      return d.entries.map((e) => ({
        entryId: e.id,
        qtyAbs: Number(qtyByEntryId[e.id] ?? Math.abs(e.qtyDelta) ?? 0),
      }));
    }

    // Movement txn: group by linen item
    const byItem = new Map<
      string,
      { pos: TxnDetailDTO["entries"]; neg: TxnDetailDTO["entries"] }
    >();

    for (const e of d.entries) {
      const key =
        e.linenItem.name + "::" + e.condition + "::" + e.location.kind; // stable enough for UI grouping
      const itemKey = e.linenItem.name; // per-item balancing expected by your action
      const cur = byItem.get(itemKey) ?? { pos: [], neg: [] };
      if (e.qtyDelta >= 0) cur.pos.push(e);
      else cur.neg.push(e);
      byItem.set(itemKey, cur);

      // also ensure key exists, but using itemKey as primary for net checks
      void key;
    }

    const updates: Array<{ entryId: string; qtyAbs: number }> = [];

    for (const [, group] of byItem) {
      // editable = positive lines
      const posAbs = group.pos.map((e) =>
        Number(qtyByEntryId[e.id] ?? Math.abs(e.qtyDelta) ?? 0)
      );
      const totalPos = posAbs.reduce((a, b) => a + b, 0);

      // push pos updates
      group.pos.forEach((e, idx) => {
        updates.push({ entryId: e.id, qtyAbs: posAbs[idx] });
      });

      // auto-balance negative lines (set total debit = totalPos)
      const negOriginalAbs = group.neg.map((e) => Math.abs(e.qtyDelta));
      const allocated = allocateProportionally(totalPos, negOriginalAbs);

      group.neg.forEach((e, idx) => {
        updates.push({ entryId: e.id, qtyAbs: allocated[idx] ?? 0 });
      });
    }

    return updates;
  }

  async function saveEdit() {
    if (!detail) return;
    if (reason.trim().length < 3) {
      T.error("Please enter a short reason (min 3 chars).");
      return;
    }
    if (!occurredAtDraft) {
      T.error("Please select a date/time.");
      return;
    }
    if (occurredAtDraft < minSelectableDate) {
      T.error("Dates before Jan 2026 are not allowed.");
      return;
    }

    const updates = buildUpdatesForSave(detail);

    setSaving(true);
    try {
      const res = await fetch(`/api/txns/${row.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          occurredAt: occurredAtDraft.toISOString(),
          updates,
        }),
      });

      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message ?? "Failed to save edits.");

      T.success("Updated (old txn voided + new txn created)");

      setEditOpen(false);
      //   router.push(`/app/txns/${json.newTransactionId}`);
      router.refresh();
    } catch (e: any) {
      T.error(e?.message ?? "Failed to save edits.");
    } finally {
      setSaving(false);
    }
  }

  const isVoided = Boolean(row.voidedAt);
  const statusTone = isVoided
    ? "bg-red-500/10 text-red-700 dark:text-red-200 dark:bg-red-500/15 border-red-500/20"
    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 dark:bg-emerald-500/15 border-emerald-500/20";
  const cols = admin ? "grid-cols-3" : "grid-cols-2";

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
      >
        <Card className="overflow-hidden rounded-3xl border border-violet-200/60 bg-white/70 shadow-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          {/* Summary header */}
          <div className="p-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    <CalendarClock className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <div className="truncate  text-sm font-semibold">
                      {humanType(row.type)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {fmt(row.occurredAt)}
                    </div>
                  </div>

                  {/* <Badge
                    variant="outline"
                    className={["ml-1 rounded-2xl border", statusTone].join(
                      " "
                    )}
                  >
                    {isVoided ? "Voided" : "Active"}
                  </Badge> */}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-2xl">
                    {row.propertyName}
                  </Badge>

                  {row.vendorName ? (
                    <Badge variant="secondary" className="rounded-2xl">
                      {row.vendorName}
                    </Badge>
                  ) : null}

                  {row.reference ? (
                    <Badge variant="secondary" className="rounded-2xl">
                      Ref: {row.reference}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-2xl"
                  onClick={onToggle}
                  aria-label={open ? "Collapse" : "Expand"}
                >
                  <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ type: "tween", duration: 0.18 }}
                  >
                    {open ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </motion.div>
                </Button>
              </div>
            </div>
          </div>

          {/* Expanded detail */}
          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                key="detail"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 160, damping: 22 }}
              >
                <div className="border-t border-violet-200/40 p-4 dark:border-violet-500/10">
                  {loading && !detail ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading details…
                    </div>
                  ) : detail ? (
                    <div className="space-y-3">
                      {/* actions row */}
                      <div className={cn("grid gap-2", cols)}>
                        <Button
                          asChild
                          variant="secondary"
                          className={cn(
                            "h-11 w-full rounded-2xl justify-center gap-2",
                            "border border-violet-200/60 bg-white/70 hover:bg-violet-50",
                            "dark:border-violet-500/15 dark:bg-zinc-950/40 dark:hover:bg-violet-500/10"
                          )}
                        >
                          <Link href={`/app/txns/${row.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="text-sm font-semibold">Open</span>
                          </Link>
                        </Button>

                        {admin ? (
                          <Button
                            type="button"
                            variant="secondary"
                            className={cn(
                              "h-11 w-full rounded-2xl justify-center gap-2",
                              "border border-violet-200/60 bg-white/70 hover:bg-violet-50",
                              "dark:border-violet-500/15 dark:bg-zinc-950/40 dark:hover:bg-violet-500/10"
                            )}
                            onClick={startEdit}
                            disabled={Boolean(detail?.voidedAt)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="text-sm font-semibold">Edit</span>
                          </Button>
                        ) : null}

                        {/* Copy only when expanded */}
                        {detail ? (
                          <CopyTxnSummaryButton
                            txn={buildCopyModel(detail, row)}
                            className="h-11 w-full rounded-2xl"
                          />
                        ) : (
                          <Button
                            type="button"
                            disabled
                            className={cn(
                              "h-11 w-full rounded-2xl justify-center gap-2",
                              "bg-violet-600/40 text-white dark:bg-violet-500/30"
                            )}
                            aria-label="Copy (load details first)"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileWarning className="h-4 w-4" />
                            )}
                            <span className="text-sm font-semibold">Copy</span>
                          </Button>
                        )}
                      </div>

                      {/* Staff-friendly detail: destination only */}
                      <TxnDetailContent txn={detail} compact staffMode />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Could not load details.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Admin Edit Sheet */}
      {admin && detail ? (
        <Sheet open={editOpen} onOpenChange={setEditOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[92dvh] rounded-t-3xl border border-violet-200/60 bg-white/90 p-0 backdrop-blur dark:border-violet-500/15 dark:bg-zinc-950/85 p-2 overflow-scroll"
          >
            <div className="p-4 sm:p-6">
              <SheetHeader className="space-y-1">
                <SheetTitle className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    <Pencil className="h-5 w-5" />
                  </span>
                  Edit Transaction
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Edit destination quantities. For movement transactions, the
                  source side is auto-balanced to keep the ledger consistent.
                </SheetDescription>
              </SheetHeader>

              <Separator className="my-4 opacity-60" />

              <div className="space-y-4 pb-24">
                {/* OccurredAt */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Occurred At (no dates before Jan 2026)
                  </div>

                  <DatePicker
                    selected={occurredAtDraft}
                    onChange={(d) => setOccurredAtDraft(d as Date)}
                    showTimeSelect
                    timeIntervals={5}
                    dateFormat="dd MMM yyyy, hh:mm aa"
                    minDate={minSelectableDate}
                    customInput={
                      <Input className="h-12 rounded-2xl" readOnly />
                    }
                  />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Reason (required)
                  </div>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Bedsheet qty entered wrong"
                    className="h-12 rounded-2xl"
                    disabled={saving}
                  />
                </div>

                {/* Editable destination lines */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted-foreground">
                      Quantities (destination only)
                    </div>
                    {isMovementType(detail.type) ? (
                      <Badge
                        variant="outline"
                        className="rounded-2xl border-emerald-500/25 text-emerald-700 dark:text-emerald-200"
                      >
                        Auto-balanced
                      </Badge>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    {detail.entries
                      .filter((e) =>
                        isMovementType(detail.type) ? e.qtyDelta > 0 : true
                      )
                      .map((e) => {
                        const qty =
                          qtyByEntryId[e.id] ?? Math.abs(e.qtyDelta) ?? 0;

                        return (
                          <div
                            key={e.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-violet-200/60 bg-white/60 p-3 dark:border-violet-500/10 dark:bg-zinc-950/40"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold capitalize">
                                {e.linenItem.name.toLowerCase()}
                              </div>
                              <div className="mt-1 truncate text-xs text-muted-foreground">
                                {e.location.name} ·{" "}
                                {e.condition.replaceAll("_", " ")}
                              </div>
                            </div>

                            <div className="w-[120px]">
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                value={qty}
                                onChange={(ev) =>
                                  setQtyByEntryId((prev) => ({
                                    ...prev,
                                    [e.id]: Number(ev.target.value),
                                  }))
                                }
                                className="h-12 rounded-2xl text-right tabular-nums"
                                disabled={saving}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 flex-1 rounded-2xl"
                    onClick={() => setEditOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    className="h-12 flex-1 rounded-2xl bg-violet-600 text-white hover:bg-violet-600/90 dark:bg-violet-500 dark:hover:bg-violet-500/90"
                    onClick={saveEdit}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
