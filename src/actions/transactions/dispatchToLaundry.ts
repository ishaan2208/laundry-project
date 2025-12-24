"use server";

import { z } from "zod";
import {
  LinenCondition,
  LocationKind,
  TxnType,
  UserRole,
} from "@prisma/client";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import { postTransaction } from "@/lib/ledger";
import { getLocationByKind, getVendorLocation } from "@/lib/workflowLocations";
import { DispatchToLaundrySchema } from "./schemas";

type ActionResult =
  | { ok: true; transactionId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function dispatchToLaundry(input: unknown): Promise<ActionResult> {
  const parsed = DispatchToLaundrySchema.safeParse(input);
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

    const soiledStore = await getLocationByKind(
      parsed.data.propertyId,
      LocationKind.SOILED_STORE
    );
    const vendorLoc = await getVendorLocation(
      parsed.data.propertyId,
      parsed.data.vendorId
    );

    const entries = parsed.data.lines.flatMap((l) => [
      {
        locationId: soiledStore.id,
        linenItemId: l.linenItemId,
        condition: LinenCondition.SOILED,
        qtyDelta: -l.qty,
        unitCost: undefined,
      },
      {
        locationId: vendorLoc.id,
        linenItemId: l.linenItemId,
        condition: LinenCondition.SOILED,
        qtyDelta: l.qty,
        unitCost: undefined,
      },
    ]);

    // Strict stock enforcement: debit from Soiled Store must not go negative (handled by ledger)
    const posted = await postTransaction({
      type: TxnType.DISPATCH_TO_LAUNDRY,
      propertyId: parsed.data.propertyId,
      vendorId: parsed.data.vendorId,
      reference: parsed.data.reference,
      note: parsed.data.note,
      occurredAt: parsed.data.occurredAt,
      createdById: user.id,
      idempotencyKey: parsed.data.idempotencyKey,
      entries,
    });
    const transactionId =
      typeof posted === "string"
        ? posted
        : (posted as any).transactionId ?? (posted as any).id;

    return { ok: true, transactionId };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message ?? "Failed to dispatch to laundry",
    };
  }
}
