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
import { resolveLocation } from "@/lib/workflowLocations";
import { CreateAdjustmentSchema } from "./schemas";

type ActionResult =
  | { ok: true; transactionId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function createAdjustment(input: unknown): Promise<ActionResult> {
  const parsed = CreateAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await requireUser();
    requireRole(user, [UserRole.ADMIN]);
    requirePropertyAccess(user, parsed.data.propertyId);

    const resolved = await Promise.all(
      parsed.data.lines.map(async (l) => {
        const loc = await resolveLocation({
          propertyId: parsed.data.propertyId,
          locationId: l.locationId,
          kind: l.locationKind,
          vendorId: l.vendorId,
        });

        return {
          locationId: loc.id,
          linenItemId: l.linenItemId,
          condition: l.condition,
          qtyDelta: l.qtyDelta,
          unitCost: undefined,
          meta: l.meta ?? undefined,
        };
      })
    );

    const posted = await postTransaction({
      type: TxnType.ADJUSTMENT,
      propertyId: parsed.data.propertyId,
      reference: parsed.data.reference,
      note: parsed.data.note,
      occurredAt: parsed.data.occurredAt,
      createdById: user.id,
      idempotencyKey: parsed.data.idempotencyKey,
      entries: resolved,
    });

    const transactionId =
      typeof posted === "string"
        ? posted
        : (posted as any).transactionId ?? (posted as any).id;

    return { ok: true, transactionId };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Failed to create adjustment" };
  }
}
