"use server";

import {
  Prisma,
  LinenCondition,
  LocationKind,
  TxnType,
  UserRole,
} from "@prisma/client";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import { postTransaction } from "@/lib/ledger";
import { getLocationByKind } from "@/lib/workflowLocations";
import { CreateProcurementSchema } from "./schemas";

type ActionResult =
  | { ok: true; transactionId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function createProcurement(input: unknown): Promise<ActionResult> {
  const parsed = CreateProcurementSchema.safeParse(input);
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
      UserRole.ACCOUNTANT,
      UserRole.STOREKEEPER,
    ]);
    requirePropertyAccess(user, parsed.data.propertyId);

    const cleanStore = await getLocationByKind(
      parsed.data.propertyId,
      LocationKind.CLEAN_STORE
    );

    const entries = parsed.data.lines.map((l) => ({
      locationId: cleanStore.id,
      linenItemId: l.linenItemId,
      condition: LinenCondition.CLEAN,
      qtyDelta: l.qty,
      unitCost:
        l.unitCost != null
          ? new Prisma.Decimal(l.unitCost).toString()
          : undefined,
      meta: l.meta ?? undefined,
    }));

    const posted = await postTransaction({
      type: TxnType.PROCUREMENT,
      propertyId: parsed.data.propertyId,
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
    return { ok: false, message: e?.message ?? "Failed to create procurement" };
  }
}
