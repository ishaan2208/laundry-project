"use server";

import { prisma } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/auth";
import { UserRole, PhysicalStockCountStatus } from "@/generated/prisma";

export type PhysicalStockCountListRow = {
  id: string;
  propertyId: string;
  propertyName: string;
  status: PhysicalStockCountStatus;
  submittedAt: Date;
  submitterName: string | null;
  submitterEmail: string | null;
  includeVendor: boolean;
  includeDiscarded: boolean;
};

export async function listPhysicalStockCounts(input?: {
  status?: PhysicalStockCountStatus;
  propertyId?: string;
  limit?: number;
}): Promise<PhysicalStockCountListRow[]> {
  const user = await requireUser();
  requireRole(user, [UserRole.ADMIN]);

  const limit = Math.min(Math.max(input?.limit ?? 100, 1), 300);

  return prisma.physicalStockCount.findMany({
    where: {
      ...(input?.status ? { status: input.status } : {}),
      ...(input?.propertyId ? { propertyId: input.propertyId } : {}),
    },
    orderBy: { submittedAt: "desc" },
    take: limit,
    select: {
      id: true,
      propertyId: true,
      status: true,
      submittedAt: true,
      includeVendor: true,
      includeDiscarded: true,
      submitter: { select: { name: true, email: true } },
      property: { select: { name: true } },
    },
  }).then((rows) =>
    rows.map((r) => ({
      id: r.id,
      propertyId: r.propertyId,
      propertyName: r.property.name,
      status: r.status,
      submittedAt: r.submittedAt,
      submitterName: r.submitter.name,
      submitterEmail: r.submitter.email,
      includeVendor: r.includeVendor,
      includeDiscarded: r.includeDiscarded,
    }))
  );
}
