"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Clipboard,
  Pencil,
  Save,
  X,
  CalendarClock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import T from "react-hot-toast";
import { TxnDetailContent, TxnDetailDTO } from "./TxnDetailContent";

type TxnListRow = {
  id: string;
  type: string;
  occurredAt: string | Date;
  reference?: string | null;
  propertyName: string;
  vendorName?: string | null;
  voidedAt?: string | Date | null;
};

function fmt(dt: string | Date) {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return format(d, "dd MMM, hh:mm a");
}

function composeTxnMessage(t: TxnDetailDTO) {
  const header = [
    `*TXN* ${t.type.replaceAll("_", " ")}`,
    `Property: ${t.property.name}`,
    t.vendor?.name ? `Vendor: ${t.vendor.name}` : undefined,
    `When: ${
      typeof t.occurredAt === "string" ? fmt(t.occurredAt) : fmt(t.occurredAt)
    }`,
    t.reference ? `Ref: ${t.reference}` : undefined,
    t.note ? `Note: ${t.note}` : undefined,
    t.voidedAt ? `Status: VOIDED` : `Status: ACTIVE`,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = t.entries
    .map((e) => {
      const dir = e.qtyDelta < 0 ? "OUT" : "IN";
      const qty = Math.abs(e.qtyDelta);
      return `- ${e.linenItem.name} · ${e.condition.replaceAll("_", " ")} · ${
        e.location.name
      } · ${dir}: ${qty}`;
    })
    .join("\n");

  return `${header}\n\n*Entries*\n${lines}\n\nTxn ID: ${t.id}`;
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

  // admin edit mode
  const [editMode, setEditMode] = React.useState(false);
  const [reason, setReason] = React.useState("");
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

  async function onCopy() {
    const t = detail ?? (await ensureDetail());
    if (!t) return;
    await navigator.clipboard.writeText(composeTxnMessage(t));
    T.success("Copied transaction summary!", { duration: 900 });
  }

  function startEdit() {
    if (!detail) return;
    const map: Record<string, number> = {};
    for (const e of detail.entries) map[e.id] = Math.abs(e.qtyDelta);
    setQtyByEntryId(map);
    setReason("");
    setEditMode(true);
  }

  async function saveEdit() {
    if (!detail) return;
    if (reason.trim().length < 3) {
      T.error("Please enter a short reason (min 3 chars).");
      return;
    }

    const updates = Object.entries(qtyByEntryId).map(([entryId, qtyAbs]) => ({
      entryId,
      qtyAbs: Number(qtyAbs ?? 0),
    }));

    setSaving(true);
    try {
      const res = await fetch(`/api/txns/${row.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, updates }),
      });

      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message ?? "Failed to save edits.");

      T.success("Updated! (Voided old + created new txn)");

      // Navigate to the new transaction detail (cleanest UX + avoids list mismatch)
      router.push(`/app/txns/${json.newTransactionId}`);
      router.refresh();
    } catch (e: any) {
      T.error(e?.message ?? "Failed to save edits.");
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
    >
      <Card className="overflow-hidden rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
        {/* Summary header */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">
                {row.type.replaceAll("_", " ")}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-2xl">
                  {row.propertyName}
                </Badge>

                {row.vendorName ? (
                  <Badge variant="secondary" className="rounded-2xl">
                    {row.vendorName}
                  </Badge>
                ) : null}

                <Badge variant="secondary" className="rounded-2xl">
                  <CalendarClock className="mr-1 h-3.5 w-3.5" />
                  {fmt(row.occurredAt)}
                </Badge>

                {row.reference ? (
                  <Badge variant="secondary" className="rounded-2xl">
                    Ref: {row.reference}
                  </Badge>
                ) : null}

                {row.voidedAt ? (
                  <Badge variant="destructive" className="rounded-2xl">
                    Voided
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-2xl">
                    Active
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-9 rounded-2xl"
                onClick={onCopy}
                disabled={loading}
                aria-label="Copy transaction"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clipboard className="mr-2 h-4 w-4" />
                )}
                Copy
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-2xl"
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
                    {/* Admin actions */}
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        asChild
                        variant="secondary"
                        className="h-10 rounded-2xl"
                      >
                        <Link href={`/app/txns/${row.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open
                        </Link>
                      </Button>

                      {admin ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-10 rounded-2xl"
                          onClick={startEdit}
                          disabled={detail.voidedAt != null}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      ) : null}
                    </div>

                    {/* Inline edit panel */}
                    {admin && editMode ? (
                      <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 dark:border-violet-500/15 dark:bg-zinc-950/40">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold">
                            Edit quantities (creates new txn)
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-2xl"
                            onClick={() => setEditMode(false)}
                            disabled={saving}
                            aria-label="Close edit"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Enter reason (required)
                          </div>
                          <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Wrong qty entered"
                            className="h-11 rounded-2xl"
                            disabled={saving}
                          />
                        </div>

                        <div className="mt-4 space-y-2">
                          {detail.entries.map((e) => {
                            const isOut = e.qtyDelta < 0;
                            const qty =
                              qtyByEntryId[e.id] ?? Math.abs(e.qtyDelta);

                            return (
                              <div
                                key={e.id}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-violet-200/50 bg-white/50 p-3 dark:border-violet-500/10 dark:bg-zinc-950/30"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="truncate text-sm font-semibold">
                                      {e.linenItem.name}
                                    </div>
                                    <Badge
                                      variant={isOut ? "outline" : "secondary"}
                                      className="rounded-xl"
                                    >
                                      {isOut ? (
                                        <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                                      ) : (
                                        <ArrowDownLeft className="mr-1 h-3.5 w-3.5" />
                                      )}
                                      {isOut ? "OUT" : "IN"}
                                    </Badge>
                                  </div>
                                  <div className="mt-1 truncate text-xs text-muted-foreground">
                                    {e.location.name} ·{" "}
                                    {e.condition.replaceAll("_", " ")}
                                  </div>
                                </div>

                                <div className="w-[110px]">
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
                                    className="h-11 rounded-2xl text-right tabular-nums"
                                    disabled={saving}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-11 flex-1 rounded-2xl"
                            onClick={() => setEditMode(false)}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="h-11 flex-1 rounded-2xl"
                            onClick={saveEdit}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save
                          </Button>
                        </div>
                      </Card>
                    ) : null}

                    {/* Detail content (no negatives) */}
                    <TxnDetailContent txn={detail} compact />
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
  );
}
