"use server";

import {
  LinenCondition,
  LocationKind,
  TxnType,
  UserRole,
} from "@prisma/client";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import { postTransaction } from "@/lib/ledger";
import { getLocationByKind, getVendorLocation } from "@/lib/workflowLocations";
import { ReceiveFromLaundrySchema } from "./index";

type ActionResult =
  | { ok: true; transactionId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function receiveFromLaundry(
  input: unknown
): Promise<ActionResult> {
  const parsed = ReceiveFromLaundrySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await requireUser();
    requireRole(user, [
      UserRole.ADMIN,
      UserRole.HOUSEKEEPING,
      UserRole.STOREKEEPER,
    ]);
    requirePropertyAccess(user, parsed.data.propertyId);

    const cleanStore = await getLocationByKind(
      parsed.data.propertyId,
      LocationKind.CLEAN_STORE
    );
    const damagedBin = await getLocationByKind(
      parsed.data.propertyId,
      LocationKind.DAMAGED_BIN
    );
    const vendorLoc = await getVendorLocation(
      parsed.data.propertyId,
      parsed.data.vendorId
    );

    const entries = parsed.data.lines.flatMap((l) => {
      const out: any[] = [];

      const cleanQty = l.receivedCleanQty ?? 0;
      const damagedQty = l.damagedQty ?? 0;
      const rewashQty = l.rewashQty ?? 0;

      if (cleanQty > 0) {
        out.push(
          {
            locationId: vendorLoc.id,
            linenItemId: l.linenItemId,
            condition: LinenCondition.SOILED,
            qtyDelta: -cleanQty,
            meta: { flow: "receive_clean" },
          },
          {
            locationId: cleanStore.id,
            linenItemId: l.linenItemId,
            condition: LinenCondition.CLEAN,
            qtyDelta: cleanQty,
            meta: { flow: "receive_clean" },
          }
        );
      }

      if (damagedQty > 0) {
        out.push(
          {
            locationId: vendorLoc.id,
            linenItemId: l.linenItemId,
            condition: LinenCondition.SOILED,
            qtyDelta: -damagedQty,
            meta: { flow: "receive_damaged" },
          },
          {
            locationId: damagedBin.id,
            linenItemId: l.linenItemId,
            condition: LinenCondition.DAMAGED,
            qtyDelta: damagedQty,
            meta: { flow: "receive_damaged" },
          }
        );
      }

      if (rewashQty > 0) {
        // status change at vendor
        out.push(
          {
            locationId: vendorLoc.id,
            linenItemId: l.linenItemId,
            condition: LinenCondition.SOILED,
            qtyDelta: -rewashQty,
            meta: { flow: "mark_rewash" },
          },
          {
            locationId: vendorLoc.id,
            linenItemId: l.linenItemId,
            condition: LinenCondition.REWASH,
            qtyDelta: rewashQty,
            meta: { flow: "mark_rewash" },
          }
        );
      }

      return out;
    });

    const posted = await postTransaction({
      type: TxnType.RECEIVE_FROM_LAUNDRY,
      propertyId: parsed.data.propertyId,
      vendorId: parsed.data.vendorId,
      reference: parsed.data.reference,
      note: parsed.data.note,
      occurredAt: parsed.data.occurredAt,
      createdById: user.id,
      idempotencyKey: parsed.data.idempotencyKey,
      strictStock: true, // vendor soiled debits must not exceed pending
      entries,
    } as any);

    const transactionId =
      typeof posted === "string"
        ? posted
        : (posted as any).transactionId ?? (posted as any).id;

    return { ok: true, transactionId };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message ?? "Failed to receive from laundry",
    };
  }
}
