"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Share2, ClipboardCopy } from "lucide-react";
import { TxnType, LinenCondition } from "@prisma/client";

type Entry = {
  linenItemName: string;
  condition: LinenCondition;
  qtyDelta: number;
};

export function CopyTxnSummaryButton(props: {
  txn: {
    id: string;
    type: TxnType;
    occurredAt: Date | string;
    propertyName: string;
    vendorName?: string;
    reference?: string;
    entries: Entry[];
  };
}) {
  const { txn } = props;
  const [copied, setCopied] = React.useState(false);

  const text = React.useMemo(() => buildSummary(txn), [txn]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className="hidden sm:inline-flex rounded-2xl border border-violet-200/60 bg-white/60 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
      >
        <Share2 className="mr-1 h-4 w-4" />
        Share
      </Badge>

      <Button
        type="button"
        onClick={copy}
        className={[
          "h-12 rounded-2xl px-4 text-sm font-semibold",
          "bg-violet-600 text-white hover:bg-violet-600/90",
          "dark:bg-violet-500 dark:hover:bg-violet-500/90",
        ].join(" ")}
        aria-label="Copy summary to clipboard"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-5 w-5" />
            Copied
          </>
        ) : (
          <>
            <ClipboardCopy className="mr-2 h-5 w-5" />
            Copy summary
          </>
        )}
      </Button>
    </div>
  );
}

function fmtDate(d: Date) {
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanType(t: TxnType) {
  if (t === TxnType.DISPATCH_TO_LAUNDRY) return "Dispatch to Laundry";
  if (t === TxnType.RECEIVE_FROM_LAUNDRY) return "Receive from Laundry";
  return t.replaceAll("_", " ");
}

function buildSummary(txn: {
  type: TxnType;
  occurredAt: Date | string;
  propertyName: string;
  vendorName?: string;
  reference?: string;
  entries: Entry[];
}) {
  const occurredAt =
    typeof txn.occurredAt === "string"
      ? new Date(txn.occurredAt)
      : txn.occurredAt;

  const header = `Laundry Update — ${fmtDate(occurredAt)}`;
  const lines: string[] = [];
  lines.push(header);
  lines.push(`Property: ${txn.propertyName}`);
  //   if (txn.vendorName) lines.push(`Vendor: ${txn.vendorName}`);
  if (txn.reference) lines.push(`Ref: ${txn.reference}`);
  lines.push(`Type: ${humanType(txn.type)}`);
  lines.push(""); // spacer

  if (txn.type === TxnType.DISPATCH_TO_LAUNDRY) {
    // ledger has -store and +vendor; avoid negatives by using max(pos, abs(neg))
    const byItem = new Map<string, { pos: number; neg: number }>();

    for (const e of txn.entries) {
      const cur = byItem.get(e.linenItemName) ?? { pos: 0, neg: 0 };
      if (e.qtyDelta >= 0) cur.pos += e.qtyDelta;
      else cur.neg += e.qtyDelta;
      byItem.set(e.linenItemName, cur);
    }

    const rows = Array.from(byItem.entries())
      .map(([name, v]) => ({ name, qty: Math.max(v.pos, Math.abs(v.neg)) }))
      .filter((r) => r.qty > 0)
      .sort((a, b) => b.qty - a.qty);

    const total = rows.reduce((s, r) => s + r.qty, 0);

    lines.push(`Total Dispatched: ${total} pcs`);
    lines.push("Items:");
    if (!rows.length) {
      lines.push("- (none)");
    } else {
      for (const r of rows) lines.push(`- ${r.name}: ${r.qty}`);
    }
    return lines.join("\n");
  }

  if (txn.type === TxnType.RECEIVE_FROM_LAUNDRY) {
    // Ignore negatives completely.
    // Total should EXCLUDE REWASH (your rule).
    const byItemCleanDamaged = new Map<string, number>();
    const byItemRewash = new Map<string, number>();

    let clean = 0;
    let damaged = 0;
    let rewash = 0;

    for (const e of txn.entries) {
      if (e.qtyDelta <= 0) continue;

      if (e.condition === "REWASH") {
        rewash += e.qtyDelta;
        byItemRewash.set(
          e.linenItemName,
          (byItemRewash.get(e.linenItemName) ?? 0) + e.qtyDelta
        );
        continue;
      }

      // CLEAN + DAMAGED contribute to total
      byItemCleanDamaged.set(
        e.linenItemName,
        (byItemCleanDamaged.get(e.linenItemName) ?? 0) + e.qtyDelta
      );

      if (e.condition === "CLEAN") clean += e.qtyDelta;
      else if (e.condition === "DAMAGED") damaged += e.qtyDelta;
    }

    const totalReceived = clean + damaged; // ✅ excludes rewash

    const rowsMain = Array.from(byItemCleanDamaged.entries())
      .map(([name, qty]) => ({ name, qty }))
      .filter((r) => r.qty > 0)
      .sort((a, b) => b.qty - a.qty);

    const rowsRewash = Array.from(byItemRewash.entries())
      .map(([name, qty]) => ({ name, qty }))
      .filter((r) => r.qty > 0)
      .sort((a, b) => b.qty - a.qty);

    lines.push(`Total Received: ${totalReceived} pcs`);
    lines.push(`Breakdown: Clean ${clean}, Damaged ${damaged}`);
    if (rewash > 0) lines.push(`Rewash (not in total): ${rewash} pcs`);
    lines.push("");

    lines.push("Items (Received):");
    if (!rowsMain.length) {
      lines.push("- (none)");
    } else {
      for (const r of rowsMain) lines.push(`- ${r.name}: ${r.qty}`);
    }

    if (rowsRewash.length) {
      lines.push("");
      lines.push("Items (Rewash):");
      for (const r of rowsRewash) lines.push(`- ${r.name}: ${r.qty}`);
    }

    return lines.join("\n");
  }

  // Fallback
  lines.push("Items:");
  lines.push("- (copy summary available only for Dispatch/Receive)");
  return lines.join("\n");
}
