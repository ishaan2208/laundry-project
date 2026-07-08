"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { txnLabel, txnTone } from "@/lib/txnLabels";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";

import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Scale,
  Undo2,
  ChevronDown,
  ExternalLink,
  Loader2,
  Pencil,
} from "lucide-react";

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

function fmtTime(dt: string | Date) {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return format(d, "hh:mm a");
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  DISPATCH_TO_LAUNDRY: ArrowUpRight,
  RECEIVE_FROM_LAUNDRY: ArrowDownLeft,
  RESEND_REWASH: RefreshCw,
  PROCUREMENT: ShoppingBag,
  DISCARD_LOST: Trash2,
  ADJUSTMENT: Scale,
  VOID_REVERSAL: Undo2,
};

const toneStyles = {
  soiled: "bg-soiled-soft text-soiled",
  clean: "bg-clean-soft text-clean",
  rewash: "bg-rewash-soft text-rewash",
  damaged: "bg-damaged-soft text-damaged",
  neutral: "bg-secondary text-secondary-foreground",
} as const;

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
    propertyId: detail.property.id,
    vendorId: detail.vendor?.id,
    reference: detail.reference ?? undefined,
    entries: detail.entries.map((e) => ({
      linenItemName: e.linenItem.name,
      condition: e.condition as any,
      qtyDelta: e.qtyDelta,
    })),
  };
}

// Allocate the source side proportionally when several debit lines exist.
function allocateProportionally(total: number, originalAbs: number[]) {
  const sum = originalAbs.reduce((a, b) => a + b, 0);
  if (!sum) return originalAbs.map((_, i) => (i === 0 ? total : 0));

  const raw = originalAbs.map((v) => (v / sum) * total);
  const floored = raw.map((v) => Math.floor(v));
  let remainder = total - floored.reduce((a, b) => a + b, 0);

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

  // Admin qty-fix drawer (voids + reposts, same timestamp semantics — no date editing).
  const [editOpen, setEditOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [qtyByEntryId, setQtyByEntryId] = React.useState<
    Record<string, number>
  >({});
  const [saving, setSaving] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);

  const voided = Boolean(row.voidedAt);
  const Icon = typeIcons[row.type] ?? Scale;
  const tone = txnTone(row.type);

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
      if (!json?.ok) throw new Error(json?.message ?? "Failed to load entry.");

      setDetail(json.txn);
      return json.txn as TxnDetailDTO;
    } catch (e: any) {
      if (e?.name === "AbortError") return null;
      toast.error(e?.message ?? "Could not load this entry.");
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
    setEditOpen(true);
  }

  function buildUpdatesForSave(d: TxnDetailDTO) {
    const movement = isMovementType(d.type);

    if (!movement) {
      return d.entries.map((e) => ({
        entryId: e.id,
        qtyAbs: Number(qtyByEntryId[e.id] ?? Math.abs(e.qtyDelta) ?? 0),
      }));
    }

    const byItem = new Map<
      string,
      { pos: TxnDetailDTO["entries"]; neg: TxnDetailDTO["entries"] }
    >();

    for (const e of d.entries) {
      const itemKey = e.linenItem.name;
      const cur = byItem.get(itemKey) ?? { pos: [], neg: [] };
      if (e.qtyDelta >= 0) cur.pos.push(e);
      else cur.neg.push(e);
      byItem.set(itemKey, cur);
    }

    const updates: Array<{ entryId: string; qtyAbs: number }> = [];

    for (const [, group] of byItem) {
      const posAbs = group.pos.map((e) =>
        Number(qtyByEntryId[e.id] ?? Math.abs(e.qtyDelta) ?? 0)
      );
      const totalPos = posAbs.reduce((a, b) => a + b, 0);

      group.pos.forEach((e, idx) => {
        updates.push({ entryId: e.id, qtyAbs: posAbs[idx] });
      });

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
      toast.error("Write a short reason first.");
      return;
    }

    const updates = buildUpdatesForSave(detail);

    setSaving(true);
    try {
      const res = await fetch(`/api/txns/${row.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, updates }),
      });

      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message ?? "Could not save.");

      toast.success("Fixed — old entry cancelled, new one saved.");

      setEditOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="surface overflow-hidden rounded-2xl">
        {/* Summary row — the whole row is the toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="press-soft flex w-full items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl",
              toneStyles[tone],
              voided && "opacity-50"
            )}
          >
            <Icon className="size-5" />
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-base font-semibold leading-tight",
                voided && "text-muted-foreground line-through"
              )}
            >
              {txnLabel(row.type)}
            </span>
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
              {fmtTime(row.occurredAt)}
              {row.vendorName ? ` · ${row.vendorName}` : ""}
              {voided ? " · cancelled" : ""}
            </span>
          </span>

          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {/* Expanding detail — CSS grid-rows trick, no motion library */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-(--ease-fluent)",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t px-3.5 py-3">
              {loading && !detail ? (
                <div className="flex items-center py-2 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading…
                </div>
              ) : detail ? (
                <div className="space-y-3">
                  <TxnDetailContent txn={detail} compact staffMode />

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/app/txns/${row.id}`}>
                        <ExternalLink className="size-4" />
                        Open full entry
                      </Link>
                    </Button>

                    {admin ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={startEdit}
                        disabled={Boolean(detail?.voidedAt)}
                      >
                        <Pencil className="size-4" />
                        Fix quantities
                      </Button>
                    ) : null}

                    <CopyTxnSummaryButton txn={buildCopyModel(detail, row)} />
                  </div>
                </div>
              ) : open ? (
                <div className="py-2 text-sm text-muted-foreground">
                  Could not load details.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Admin: fix quantities (no date changes — entries stay on their real day) */}
      {admin && detail ? (
        <Drawer open={editOpen} onOpenChange={setEditOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Fix quantities</DrawerTitle>
              <DrawerDescription>
                Cancels this entry and saves a corrected copy. The source side
                is balanced automatically.
              </DrawerDescription>
            </DrawerHeader>

            <DrawerBody className="space-y-4 px-5">
              <div className="space-y-1.5">
                <label
                  htmlFor={`reason-${row.id}`}
                  className="text-sm font-medium text-muted-foreground"
                >
                  Reason (required)
                </label>
                <Input
                  id={`reason-${row.id}`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. bedsheet count was wrong"
                  className="h-12 rounded-xl text-base"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                {detail.entries
                  .filter((e) =>
                    isMovementType(detail.type) ? e.qtyDelta > 0 : true
                  )
                  .map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold">
                          {e.linenItem.name}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {e.location.name}
                        </div>
                      </div>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={qtyByEntryId[e.id] ?? Math.abs(e.qtyDelta)}
                        onChange={(ev) =>
                          setQtyByEntryId((prev) => ({
                            ...prev,
                            [e.id]: Number(ev.target.value),
                          }))
                        }
                        className="h-12 w-24 rounded-xl text-right text-base tabular-nums"
                        disabled={saving}
                      />
                    </div>
                  ))}
              </div>
            </DrawerBody>

            <DrawerFooter className="space-y-2">
              <Button
                size="xl"
                className="w-full"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save corrected entry"
                )}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => setEditOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : null}
    </>
  );
}
