"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { LinenCondition, TxnType } from "@/generated/prisma";
import { getVendorLocation } from "@/lib/workflowLocations";

export type VendorLinenLedgerMovement = {
  transactionId: string;
  occurredAt: Date;
  type: TxnType;
  reference: string | null;
  note: string | null;
  /** Net change at this vendor location for this linen item (all conditions). */
  netQty: number;
  /** Per-condition deltas, e.g. "SOILED +10 · REWASH -2" */
  summary: string;
  balanceAfter: number;
};

export async function getVendorLinenLedger(input: {
  propertyId: string;
  vendorId: string;
  linenItemId: string;
}): Promise<
  | {
      ok: true;
      property: { id: string; name: string };
      vendor: { id: string; name: string };
      linenItem: { id: string; name: string; sku: string | null };
      vendorLocationLabel: string;
      movements: VendorLinenLedgerMovement[];
      currentBalance: number;
    }
  | { ok: false; message: string }
> {
  const user = await requireUser();
  await requirePropertyAccess(user, input.propertyId);

  const [prop, vendor, linenItem] = await Promise.all([
    prisma.property.findFirst({
      where: { id: input.propertyId, isActive: true },
      select: { id: true, name: true },
    }),
    prisma.vendor.findFirst({
      where: { id: input.vendorId, isActive: true },
      select: { id: true, name: true },
    }),
    prisma.linenItem.findFirst({
      where: { id: input.linenItemId, isActive: true },
      select: { id: true, name: true, sku: true },
    }),
  ]);

  if (!prop) return { ok: false, message: "Property not found." };
  if (!vendor) return { ok: false, message: "Vendor not found or inactive." };
  if (!linenItem) return { ok: false, message: "Linen item not found." };

  let vendorLoc: { id: string; name: string };
  try {
    const loc = await getVendorLocation(input.propertyId, input.vendorId);
    vendorLoc = { id: loc.id, name: loc.name };
  } catch {
    return {
      ok: false,
      message: "Could not resolve vendor laundry location for this property.",
    };
  }

  const entries = await prisma.transactionEntry.findMany({
    where: {
      locationId: vendorLoc.id,
      linenItemId: input.linenItemId,
      transaction: { voidedAt: null },
    },
    select: {
      id: true,
      qtyDelta: true,
      condition: true,
      transactionId: true,
      transaction: {
        select: {
          id: true,
          type: true,
          occurredAt: true,
          reference: true,
          note: true,
        },
      },
    },
  });

  entries.sort((a, b) => {
    const ta = a.transaction.occurredAt.getTime();
    const tb = b.transaction.occurredAt.getTime();
    if (ta !== tb) return ta - tb;
    if (a.transactionId !== b.transactionId) {
      return a.transactionId.localeCompare(b.transactionId);
    }
    return a.id.localeCompare(b.id);
  });

  const txnOrder: string[] = [];
  const byTxn = new Map<string, typeof entries>();
  for (const e of entries) {
    const tid = e.transactionId;
    if (!byTxn.has(tid)) {
      txnOrder.push(tid);
      byTxn.set(tid, []);
    }
    byTxn.get(tid)!.push(e);
  }

  let running = 0;
  const movements: VendorLinenLedgerMovement[] = [];

  for (const tid of txnOrder) {
    const group = byTxn.get(tid)!;
    const t = group[0].transaction;
    let net = 0;
    const condDeltas = new Map<LinenCondition, number>();
    for (const e of group) {
      net += e.qtyDelta;
      condDeltas.set(e.condition, (condDeltas.get(e.condition) ?? 0) + e.qtyDelta);
    }
    const parts: string[] = [];
    for (const c of Object.values(LinenCondition)) {
      const q = condDeltas.get(c) ?? 0;
      if (q !== 0) {
        parts.push(`${c.replaceAll("_", " ")} ${q > 0 ? "+" : ""}${q}`);
      }
    }
    running += net;
    movements.push({
      transactionId: t.id,
      occurredAt: t.occurredAt,
      type: t.type,
      reference: t.reference,
      note: t.note,
      netQty: net,
      summary: parts.length ? parts.join(" · ") : "—",
      balanceAfter: running,
    });
  }

  return {
    ok: true,
    property: prop,
    vendor,
    linenItem,
    vendorLocationLabel: vendorLoc.name,
    movements,
    currentBalance: running,
  };
}
