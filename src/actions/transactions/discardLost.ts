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
import { getLocationByKind, resolveLocation } from "@/lib/workflowLocations";
import { DiscardLostSchema } from "./schemas";

type ActionResult =
  | { ok: true; transactionId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function discardLost(input: unknown): Promise<ActionResult> {
  const parsed = DiscardLostSchema.safeParse(input);
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

    const source =
      parsed.data.sourceLocationId ||
      parsed.data.sourceKind ||
      LocationKind.DAMAGED_BIN;

    const sourceLoc = await resolveLocation({
      propertyId: parsed.data.propertyId,
      locationId:
        typeof source === "string" && parsed.data.sourceLocationId
          ? source
          : undefined,
      kind: !parsed.data.sourceLocationId
        ? parsed.data.sourceKind ?? LocationKind.DAMAGED_BIN
        : undefined,
      vendorId: parsed.data.vendorId,
    });

    const discardLoc = await getLocationByKind(
      parsed.data.propertyId,
      LocationKind.DISCARDED_LOST
    );

    const defaultCond = parsed.data.defaultCondition ?? LinenCondition.DAMAGED;

    const entries = parsed.data.lines.flatMap((l) => {
      const condition = l.condition ?? defaultCond;
      return [
        {
          locationId: sourceLoc.id,
          linenItemId: l.linenItemId,
          condition,
          qtyDelta: -l.qty,
          unitCost: undefined,
          meta: { reason: parsed.data.reason, flow: "discard_lost" },
        },
        {
          locationId: discardLoc.id,
          linenItemId: l.linenItemId,
          condition,
          qtyDelta: l.qty,
          unitCost: undefined,
          meta: { reason: parsed.data.reason, flow: "discard_lost" },
        },
      ];
    });

    const combinedNote = parsed.data.note?.length
      ? `${parsed.data.reason} — ${parsed.data.note}`
      : parsed.data.reason;

    const posted = await postTransaction({
      type: TxnType.DISCARD_LOST,
      propertyId: parsed.data.propertyId,
      vendorId:
        parsed.data.sourceKind === LocationKind.VENDOR
          ? parsed.data.vendorId
          : undefined,
      reference: parsed.data.reference,
      note: combinedNote,
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
    return { ok: false, message: e?.message ?? "Failed to discard/lost" };
  }
}
