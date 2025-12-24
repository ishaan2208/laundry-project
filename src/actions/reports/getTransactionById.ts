"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { TxnType } from "@prisma/client";

export async function getTransactionById(id: string) {
  console.log("id", id);
  if (!id || typeof id !== "string") {
    return { ok: false as const, message: "Missing transaction id." };
  }

  const user = await requireUser();

  const txn = await prisma.transaction.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      voidedBy: { select: { id: true, name: true, email: true } },
      entries: {
        orderBy: { id: "asc" },
        include: {
          linenItem: { select: { id: true, name: true } },
          location: {
            select: {
              id: true,
              name: true,
              kind: true,
              vendorId: true,
              vendor: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!txn) return { ok: false as const, message: "Transaction not found." };

  await requirePropertyAccess(user, txn.propertyId);

  // Reversal link (MVP): if you store reversalOfId on reversal txn, this finds it.
  // If your schema instead stores reversalTxnId on original, swap this lookup.
  const reversal = txn.voidedAt
    ? await prisma.transaction.findFirst({
        where: {
          type: TxnType.VOID_REVERSAL,
          reversalOfId: txn.id, // <-- adjust if your schema differs
        } as any,
        select: { id: true, occurredAt: true },
      })
    : null;

  return {
    ok: true as const,
    txn: {
      id: txn.id,
      type: txn.type,
      occurredAt: txn.occurredAt,
      reference: txn.reference ?? null,
      note: txn.note ?? null,

      property: txn.property,
      vendor: txn.vendor ?? null,

      createdBy: {
        id: txn.createdBy.id,
        name: txn.createdBy.name ?? txn.createdBy.email ?? null,
        role: txn.createdBy.role,
      },

      voidedAt: txn.voidedAt ?? null,
      voidReason: txn.voidReason ?? null,
      voidedBy: txn.voidedBy
        ? {
            id: txn.voidedBy.id,
            name: txn.voidedBy.name ?? txn.voidedBy.email ?? null,
          }
        : null,

      reversal: reversal
        ? { id: reversal.id, occurredAt: reversal.occurredAt }
        : null,

      entries: txn.entries.map((e) => ({
        id: e.id,
        qtyDelta: e.qtyDelta,
        condition: e.condition,
        linenItem: e.linenItem,
        location: {
          id: e.location.id,
          name: e.location.name,
          kind: e.location.kind,
          vendorId: e.location.vendorId ?? null,
          vendorName: e.location.vendor?.name ?? null,
        },
      })),
    },
  };
}
