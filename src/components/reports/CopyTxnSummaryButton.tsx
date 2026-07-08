"use client";

import * as React from "react";
import { TxnType, LinenCondition } from "@/generated/prisma";
import { ShareUpdate } from "@/components/mobile/ShareUpdate";
import { getPendingItemsForVendor } from "@/actions/ui/getPendingItemsForVendor";
import {
  buildSentStory,
  buildReceivedStory,
  type StoryPendingLine,
} from "@/lib/laundryStory";

type Entry = {
  linenItemName: string;
  condition: LinenCondition;
  qtyDelta: number;
};

type TxnModel = {
  id: string;
  type: TxnType;
  occurredAt: Date | string;
  propertyName: string;
  vendorName?: string;
  reference?: string;
  propertyId?: string;
  vendorId?: string;
  entries: Entry[];
};

/**
 * Share buttons for a register entry: the same Hinglish story staff get
 * after saving a flow, rebuilt from the entry plus the vendor's CURRENT
 * balance. Renders nothing for entry types that aren't sent/received.
 */
export function CopyTxnSummaryButton(props: {
  className?: string;
  txn: TxnModel;
}) {
  const { txn, className } = props;
  const [story, setStory] = React.useState<string | null>(null);

  const shareable =
    txn.type === TxnType.DISPATCH_TO_LAUNDRY ||
    txn.type === TxnType.RECEIVE_FROM_LAUNDRY;

  React.useEffect(() => {
    if (!shareable) return;
    let cancelled = false;

    (async () => {
      let pendingLines: StoryPendingLine[] | null = null;
      if (txn.propertyId && txn.vendorId) {
        try {
          const res = await getPendingItemsForVendor({
            propertyId: txn.propertyId,
            vendorId: txn.vendorId,
          });
          if (res.ok) {
            pendingLines = res.rows.map((r) => ({
              name: r.linenItemName,
              qty: r.totalPending,
            }));
          }
        } catch {
          pendingLines = null;
        }
      }

      const when =
        typeof txn.occurredAt === "string"
          ? new Date(txn.occurredAt)
          : txn.occurredAt;

      let text: string;
      if (txn.type === TxnType.DISPATCH_TO_LAUNDRY) {
        // Ledger has -store and +vendor; use max(pos, |neg|) per item.
        const byItem = new Map<string, { pos: number; neg: number }>();
        for (const e of txn.entries) {
          const cur = byItem.get(e.linenItemName) ?? { pos: 0, neg: 0 };
          if (e.qtyDelta >= 0) cur.pos += e.qtyDelta;
          else cur.neg += e.qtyDelta;
          byItem.set(e.linenItemName, cur);
        }
        const lines = [...byItem.entries()]
          .map(([name, v]) => ({ name, qty: Math.max(v.pos, Math.abs(v.neg)) }))
          .filter((l) => l.qty > 0)
          .sort((a, b) => b.qty - a.qty);

        text = buildSentStory({
          propertyName: txn.propertyName,
          when,
          lines,
          pendingLines,
        });
      } else {
        const byItem = new Map<
          string,
          { clean: number; damaged: number; rewash: number }
        >();
        for (const e of txn.entries) {
          if (e.qtyDelta <= 0) continue;
          const cur =
            byItem.get(e.linenItemName) ?? { clean: 0, damaged: 0, rewash: 0 };
          if (e.condition === "CLEAN") cur.clean += e.qtyDelta;
          else if (e.condition === "DAMAGED") cur.damaged += e.qtyDelta;
          else if (e.condition === "REWASH") cur.rewash += e.qtyDelta;
          byItem.set(e.linenItemName, cur);
        }
        const lines = [...byItem.entries()]
          .map(([name, v]) => ({ name, ...v }))
          .sort(
            (a, b) =>
              b.clean + b.damaged + b.rewash - (a.clean + a.damaged + a.rewash)
          );

        text = buildReceivedStory({
          propertyName: txn.propertyName,
          when,
          lines,
          pendingLines,
        });
      }

      if (!cancelled) setStory(text);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txn.id, shareable]);

  if (!shareable) return null;

  return <ShareUpdate text={story} compact className={className} />;
}
