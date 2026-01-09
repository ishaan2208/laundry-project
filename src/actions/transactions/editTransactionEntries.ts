"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { TxnType, UserRole } from "@prisma/client";
import { postTransaction, voidTransaction } from "@/lib/ledger";
import { revalidatePath } from "next/cache";

const EditTxnInput = z.object({
  transactionId: z.string().cuid(),
  reason: z.string().trim().min(3).max(200),
  updates: z
    .array(
      z.object({
        entryId: z.string().cuid(),
        qtyAbs: z.number().int().min(0).max(1_000_000),
      })
    )
    .min(1),
});

type ActionResult =
  | { ok: true; newTransactionId: string; voidedTransactionId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const MOVEMENT_TYPES = new Set<TxnType>([
  TxnType.DISPATCH_TO_LAUNDRY,
  TxnType.RECEIVE_FROM_LAUNDRY,
  TxnType.RESEND_REWASH,
]);

function extractTxnId(posted: unknown): string {
  if (typeof posted === "string") return posted;
  if (posted && typeof posted === "object") {
    const anyPosted = posted as any;
    return anyPosted.transactionId ?? anyPosted.id;
  }
  throw new Error("Unexpected postTransaction response");
}

export async function editTransactionEntriesAction(
  input: unknown
): Promise<ActionResult> {
  const parsed = EditTxnInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) {
    return { ok: false, message: "Only ADMIN can edit transactions." };
  }

  const { transactionId, reason, updates } = parsed.data;

  const txn = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      type: true,
      propertyId: true,
      vendorId: true,
      reference: true,
      note: true,
      occurredAt: true,
      voidedAt: true,
      reversalOfId: true,
      entries: {
        select: {
          id: true,
          locationId: true,
          linenItemId: true,
          condition: true,
          qtyDelta: true,
          unitCost: true,
          meta: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!txn) return { ok: false, message: "Transaction not found." };
  if (txn.type === TxnType.VOID_REVERSAL || txn.reversalOfId) {
    return { ok: false, message: "Reversal transactions cannot be edited." };
  }
  if (txn.voidedAt)
    return { ok: false, message: "Transaction is already voided." };
  if (!txn.entries.length)
    return { ok: false, message: "No entries found to edit." };

  const updateMap = new Map<string, number>();
  for (const u of updates) updateMap.set(u.entryId, u.qtyAbs);

  // Build edited entries (qtyAbs overrides magnitude; sign stays same)
  const newEntries = txn.entries
    .map((e) => {
      const abs = updateMap.has(e.id)
        ? updateMap.get(e.id)!
        : Math.abs(e.qtyDelta);
      const signed = e.qtyDelta >= 0 ? abs : -abs;
      return {
        locationId: e.locationId,
        linenItemId: e.linenItemId,
        condition: e.condition,
        qtyDelta: signed,
        unitCost: e.unitCost ? e.unitCost.toString() : undefined,
        meta: e.meta ?? undefined,
      };
    })
    .filter((e) => e.qtyDelta !== 0);

  if (!newEntries.length) {
    return { ok: false, message: "All entries became zero. Nothing to post." };
  }

  // Ledger integrity guard for movement-type txns:
  // net per linenItem must remain 0 (prevents broken double-entry edits)
  if (MOVEMENT_TYPES.has(txn.type)) {
    const sumByItem = new Map<string, number>();
    for (const e of newEntries) {
      sumByItem.set(
        e.linenItemId,
        (sumByItem.get(e.linenItemId) ?? 0) + e.qtyDelta
      );
    }
    for (const [, sum] of sumByItem) {
      if (sum !== 0) {
        return {
          ok: false,
          message:
            "For movement transactions, edits must net to 0 per item. Please adjust both IN/OUT sides equally.",
        };
      }
    }
  }

  // 1) VOID original (creates reversal txn)
  const voidRes = await voidTransaction({
    transactionId: txn.id,
    voidedById: user.id,
    reason: `EDIT: ${reason}`,
  });

  if (!voidRes?.ok) {
    return {
      ok: false,
      message: voidRes ? "" : "Failed to void original transaction.",
    };
  }

  // 2) POST replacement txn (new id)
  const posted = await postTransaction({
    type: txn.type,
    propertyId: txn.propertyId,
    vendorId: txn.vendorId ?? undefined,
    reference: txn.reference ?? undefined,
    note: [txn.note, `EDITED_FROM:${txn.id}`, `EDIT_REASON:${reason}`]
      .filter(Boolean)
      .join("\n"),
    occurredAt: txn.occurredAt,
    createdById: user.id,
    entries: newEntries,
  });

  const newTransactionId = extractTxnId(posted);

  // Revalidate main surfaces
  revalidatePath("/app/txns");
  revalidatePath("/app/stock");
  revalidatePath("/app/vendors");

  return { ok: true, newTransactionId, voidedTransactionId: txn.id };
}
