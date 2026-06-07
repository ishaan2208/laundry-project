import "server-only";

import {
  LinenCondition,
  LocationKind,
  TxnType,
  UserRole,
} from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { postTransaction } from "@/lib/ledger";
import { getLocationByKind, getVendorLocation } from "@/lib/workflowLocations";
import { istDayEndInstant } from "@/lib/dateKeys";
import { resolvePropertyByPmsId } from "@/lib/complianceQueries";

async function getServiceCreatedById(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) {
    throw new Error("No active ADMIN user found for service backfill.");
  }
  return admin.id;
}

export async function backfillDispatchForPmsProperty(input: {
  pmsPropertyId: number;
  vendorId: string;
  dateKey: string;
  lines: Array<{ linenItemId: string; qty: number }>;
  note?: string;
}) {
  const property = await resolvePropertyByPmsId(input.pmsPropertyId);
  if (!property) {
    throw new Error("Laundry property mapping not found for this PMS property.");
  }

  const createdById = await getServiceCreatedById();
  const soiledStore = await getLocationByKind(property.id, LocationKind.SOILED_STORE);
  const vendorLoc = await getVendorLocation(property.id, input.vendorId);

  const entries = input.lines.flatMap((l) => [
    {
      locationId: soiledStore.id,
      linenItemId: l.linenItemId,
      condition: LinenCondition.SOILED,
      qtyDelta: -l.qty,
    },
    {
      locationId: vendorLoc.id,
      linenItemId: l.linenItemId,
      condition: LinenCondition.SOILED,
      qtyDelta: l.qty,
    },
  ]);

  const posted = await postTransaction({
    type: TxnType.DISPATCH_TO_LAUNDRY,
    propertyId: property.id,
    vendorId: input.vendorId,
    note: input.note ?? `Backfilled via PMS compliance for ${input.dateKey}`,
    occurredAt: istDayEndInstant(input.dateKey),
    createdById,
    idempotencyKey: `compliance-dispatch:${input.pmsPropertyId}:${input.dateKey}:${Date.now()}`,
    entries,
  });

  if (posted.ok === false) {
    throw new Error(posted.error.message);
  }

  return {
    transactionId: posted.data.transactionId,
    laundryPropertyId: property.id,
  };
}

export async function backfillReceiveForPmsProperty(input: {
  pmsPropertyId: number;
  vendorId: string;
  dateKey: string;
  lines: Array<{
    linenItemId: string;
    receivedCleanQty?: number;
    damagedQty?: number;
    rewashQty?: number;
  }>;
  note?: string;
}) {
  const property = await resolvePropertyByPmsId(input.pmsPropertyId);
  if (!property) {
    throw new Error("Laundry property mapping not found for this PMS property.");
  }

  const createdById = await getServiceCreatedById();
  const cleanStore = await getLocationByKind(property.id, LocationKind.CLEAN_STORE);
  const damagedBin = await getLocationByKind(property.id, LocationKind.DAMAGED_BIN);
  const vendorLoc = await getVendorLocation(property.id, input.vendorId);

  const entries = input.lines.flatMap((l) => {
    const out: Array<{
      locationId: string;
      linenItemId: string;
      condition: LinenCondition;
      qtyDelta: number;
      meta?: Record<string, string>;
    }> = [];

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

  if (entries.length === 0) {
    throw new Error("At least one receive line with quantity is required.");
  }

  const posted = await postTransaction({
    type: TxnType.RECEIVE_FROM_LAUNDRY,
    propertyId: property.id,
    vendorId: input.vendorId,
    note: input.note ?? `Backfilled via PMS compliance for ${input.dateKey}`,
    occurredAt: istDayEndInstant(input.dateKey),
    createdById,
    idempotencyKey: `compliance-receive:${input.pmsPropertyId}:${input.dateKey}:${Date.now()}`,
    strictStock: true,
    entries,
  } as Parameters<typeof postTransaction>[0] & { strictStock: boolean });

  if (posted.ok === false) {
    throw new Error(posted.error.message);
  }

  return {
    transactionId: posted.data.transactionId,
    laundryPropertyId: property.id,
  };
}
