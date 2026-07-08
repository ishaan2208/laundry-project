"use client";

import * as React from "react";
import { StatusPill } from "@/components/mobile/StatusPill";
import { cn } from "@/lib/utils";

export type TxnDetailDTO = {
  id: string;
  type: string;
  occurredAt: string | Date;
  reference?: string | null;
  note?: string | null;

  voidedAt?: string | Date | null;
  voidReason?: string | null;
  voidedBy?: { name?: string | null } | null;

  property: { id?: string; name: string };
  vendor?: { id?: string; name: string } | null;

  reversal?: { id: string } | null;

  entries: Array<{
    id: string;
    qtyDelta: number;
    condition: string;
    linenItem: { name: string };
    location: {
      name: string;
      kind: string;
      vendorName?: string | null;
    };
  }>;
};

const locationLabels: Record<string, string> = {
  CLEAN_STORE: "Ready to use",
  SOILED_STORE: "To be washed",
  REWASH_BIN: "Wash again",
  DAMAGED_BIN: "Damaged",
  DISCARDED_LOST: "Thrown away / lost",
  VENDOR: "At the laundry",
};

function getStaffEntries(entries: TxnDetailDTO["entries"]) {
  // Staff view: show only destination (IN) entries.
  const positives = entries.filter((e) => e.qtyDelta > 0);
  if (positives.length) return positives;
  return entries.map((e) => ({ ...e, qtyDelta: Math.abs(e.qtyDelta) }));
}

/** Compact "what went where" list used inside register rows. */
export function TxnDetailContent({
  txn,
  compact = false,
  staffMode = true,
}: {
  txn: TxnDetailDTO;
  headerSlot?: React.ReactNode;
  compact?: boolean;
  staffMode?: boolean;
}) {
  const visibleEntries = staffMode ? getStaffEntries(txn.entries) : txn.entries;

  const byLocation = React.useMemo(() => {
    const map = new Map<
      string,
      {
        locationName: string;
        locationKind: string;
        vendorName?: string | null;
        entries: typeof visibleEntries;
        totalQty: number;
      }
    >();

    for (const e of visibleEntries) {
      const key = `${e.location.kind}:${e.location.name}`;
      let bucket = map.get(key);
      if (!bucket) {
        bucket = {
          locationName: e.location.name,
          locationKind: e.location.kind,
          vendorName: e.location.vendorName,
          entries: [],
          totalQty: 0,
        };
        map.set(key, bucket);
      }
      bucket.entries.push(e);
      bucket.totalQty += Math.abs(e.qtyDelta);
    }

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [visibleEntries]);

  if (!byLocation.length) {
    return (
      <p className="text-sm text-muted-foreground">Nothing to show here.</p>
    );
  }

  return (
    <div className={cn("space-y-3", !compact && "space-y-4")}>
      {byLocation.map((grp) => (
        <div
          key={`${grp.locationKind}:${grp.locationName}`}
          className="rounded-xl bg-muted/60 px-3 py-2.5"
        >
          <div className="flex items-center justify-between gap-3 pb-1">
            <span className="truncate text-sm font-bold">
              {locationLabels[grp.locationKind] ?? grp.locationName}
              {grp.vendorName ? ` · ${grp.vendorName}` : ""}
            </span>
            <span data-numeric className="text-sm font-bold">
              {grp.totalQty} pcs
            </span>
          </div>

          <ul className="divide-y divide-border/70">
            {grp.entries
              .slice()
              .sort((a, b) => Math.abs(b.qtyDelta) - Math.abs(a.qtyDelta))
              .map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {e.linenItem.name}
                    </span>
                    <StatusPill
                      condition={e.condition as any}
                      className="px-2 py-0.5"
                    />
                  </div>
                  <span data-numeric className="text-sm font-bold">
                    {Math.abs(e.qtyDelta)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}

      {txn.note ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {txn.note}
        </p>
      ) : null}
    </div>
  );
}
