"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole, requirePropertyAccess } from "@/lib/auth";
import { UserRole, PhysicalStockCountStatus } from "@/generated/prisma";
import { computeStockAuditRollupCore } from "@/lib/computeStockAuditRollupCore";

export type PhysicalStockCountDetail = {
  id: string;
  propertyId: string;
  propertyName: string;
  status: PhysicalStockCountStatus;
  includeVendor: boolean;
  includeDiscarded: boolean;
  staffNote: string | null;
  submittedAt: Date;
  submitterName: string | null;
  submitterEmail: string | null;
  reviewedAt: Date | null;
  reviewerName: string | null;
  reviewNote: string | null;
  approvalTransactionId: string | null;
  lines: {
    linenItemId: string;
    linenItemName: string;
    sku: string | null;
    countedQty: number;
    approvedQty: number | null;
    bookQtyAtSubmit: number;
    bookQtyNow: number | null;
    deltaAtSubmit: number;
    /** Staff count vs book at submit */
    deltaStaffAtSubmit: number;
    /** (approved or staff) vs book now — pending only */
    deltaEffectiveAtNow: number | null;
  }[];
};

export async function getPhysicalStockCount(
  id: string
): Promise<PhysicalStockCountDetail | null> {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const row = await prisma.physicalStockCount.findUnique({
    where: { id },
    include: {
      property: { select: { name: true } },
      submitter: { select: { name: true, email: true } },
      reviewer: { select: { name: true } },
      lines: {
        include: { linenItem: { select: { name: true, sku: true } } },
        orderBy: { linenItem: { name: "asc" } },
      },
    },
  });

  if (!row) return null;

  let bookNowMap: Map<string, number> | null = null;
  if (row.status === PhysicalStockCountStatus.PENDING_REVIEW) {
    const rollup = await computeStockAuditRollupCore({
      propertyId: row.propertyId,
      includeVendor: row.includeVendor,
      includeDiscarded: row.includeDiscarded,
    });
    bookNowMap = new Map(rollup.rows.map((r) => [r.linenItemId, r.totalQty]));
  }

  return {
    id: row.id,
    propertyId: row.propertyId,
    propertyName: row.property.name,
    status: row.status,
    includeVendor: row.includeVendor,
    includeDiscarded: row.includeDiscarded,
    staffNote: row.staffNote,
    submittedAt: row.submittedAt,
    submitterName: row.submitter.name,
    submitterEmail: row.submitter.email,
    reviewedAt: row.reviewedAt,
    reviewerName: row.reviewer?.name ?? null,
    reviewNote: row.reviewNote,
    approvalTransactionId: row.approvalTransactionId,
    lines: row.lines.map((l) => {
      const bookNow = bookNowMap?.get(l.linenItemId) ?? null;
      const effective = l.approvedQty ?? l.countedQty;
      return {
        linenItemId: l.linenItemId,
        linenItemName: l.linenItem.name,
        sku: l.linenItem.sku,
        countedQty: l.countedQty,
        approvedQty: l.approvedQty,
        bookQtyAtSubmit: l.bookQtyAtSubmit,
        bookQtyNow: bookNow,
        deltaAtSubmit: effective - l.bookQtyAtSubmit,
        deltaStaffAtSubmit: l.countedQty - l.bookQtyAtSubmit,
        deltaEffectiveAtNow:
          bookNow !== null ? effective - bookNow : null,
      };
    }),
  };
}

/** Staff: load count by id if they submitted it (read-only). */
export async function getPhysicalStockCountForSubmitter(
  id: string
): Promise<PhysicalStockCountDetail | null> {
  const user = await requireUser();
  const row = await prisma.physicalStockCount.findFirst({
    where: { id, submittedById: user.id },
    include: {
      property: { select: { name: true } },
      submitter: { select: { name: true, email: true } },
      reviewer: { select: { name: true } },
      lines: {
        include: { linenItem: { select: { name: true, sku: true } } },
        orderBy: { linenItem: { name: "asc" } },
      },
    },
  });
  if (!row) return null;
  await requirePropertyAccess(user, row.propertyId);

  const rollup = await computeStockAuditRollupCore({
    propertyId: row.propertyId,
    includeVendor: row.includeVendor,
    includeDiscarded: row.includeDiscarded,
  });
  const bookNowMap = new Map(rollup.rows.map((r) => [r.linenItemId, r.totalQty]));

  return {
    id: row.id,
    propertyId: row.propertyId,
    propertyName: row.property.name,
    status: row.status,
    includeVendor: row.includeVendor,
    includeDiscarded: row.includeDiscarded,
    staffNote: row.staffNote,
    submittedAt: row.submittedAt,
    submitterName: row.submitter.name,
    submitterEmail: row.submitter.email,
    reviewedAt: row.reviewedAt,
    reviewerName: row.reviewer?.name ?? null,
    reviewNote: row.reviewNote,
    approvalTransactionId: row.approvalTransactionId,
    lines: row.lines.map((l) => {
      const bookNow = bookNowMap.get(l.linenItemId) ?? 0;
      const effective = l.approvedQty ?? l.countedQty;
      return {
        linenItemId: l.linenItemId,
        linenItemName: l.linenItem.name,
        sku: l.linenItem.sku,
        countedQty: l.countedQty,
        approvedQty: l.approvedQty,
        bookQtyAtSubmit: l.bookQtyAtSubmit,
        bookQtyNow: bookNow,
        deltaAtSubmit: effective - l.bookQtyAtSubmit,
        deltaStaffAtSubmit: l.countedQty - l.bookQtyAtSubmit,
        deltaEffectiveAtNow: effective - bookNow,
      };
    }),
  };
}
