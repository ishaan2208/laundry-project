"use server";

import { prisma } from "@/lib/db";
import { requirePropertyAccess, requireUser } from "@/lib/auth";
import { LocationKind } from "@prisma/client";

export type VendorPendingTopRow = {
  vendorId: string;
  vendorName: string;
  pendingQty: number; // ledger-correct SUM(qtyDelta) at vendor locations
};

export async function getTopVendorPending(
  propertyId: string,
  limit: number = 3
): Promise<VendorPendingTopRow[]> {
  const user = await requireUser();
  await requirePropertyAccess(user, propertyId);

  // ✅ ledger-correct: DO NOT filter out voided txns here.
  // Original entries + reversal entries net out correctly.
  const rows = await prisma.$queryRaw<VendorPendingTopRow[]>`
    SELECT
      v."id"           AS "vendorId",
      v."name"         AS "vendorName",
      COALESCE(SUM(te."qtyDelta"), 0)::int AS "pendingQty"
    FROM "TransactionEntry" te
    JOIN "Location" l ON l."id" = te."locationId"
    JOIN "Vendor" v   ON v."id" = l."vendorId"
    WHERE
      l."propertyId" = ${propertyId}
      AND l."kind"   = ${LocationKind.VENDOR}
      AND v."isActive" = true
    GROUP BY v."id", v."name"
    ORDER BY "pendingQty" DESC
    LIMIT ${limit};
  `;

  return rows;
}
