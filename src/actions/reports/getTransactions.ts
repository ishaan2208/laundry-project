"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { TxnType, UserRole } from "@prisma/client";
import { TxnListRow } from "../reports/types";

function parseDateOrNull(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function getTransactions(input: {
  propertyId?: string;
  vendorId?: string;
  type?: TxnType;
  q?: string; // search reference/note
  from?: string; // ISO
  to?: string; // ISO
  includeVoided?: boolean;
  cursor?: string; // txn id
  take?: number;
}) {
  const user = await requireUser();

  // defaults: last 7 days
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const from = parseDateOrNull(input.from) ?? defaultFrom;
  const to = parseDateOrNull(input.to) ?? now;

  const take = Math.min(Math.max(input.take ?? 25, 10), 50);

  // property scoping (housekeeping MUST pass propertyId)
  if (user.role !== UserRole.ADMIN) {
    if (!input.propertyId) {
      return { ok: false as const, message: "propertyId is required." };
    }
    await requirePropertyAccess(user, input.propertyId);
  } else {
    if (input.propertyId) {
      await requirePropertyAccess(user, input.propertyId);
    }
  }

  const where: any = {
    occurredAt: { gte: from, lte: to },
    ...(input.propertyId ? { propertyId: input.propertyId } : {}),
    ...(input.vendorId ? { vendorId: input.vendorId } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.includeVoided ? {} : { voidedAt: null }),
    ...(input.q
      ? {
          OR: [
            { reference: { contains: input.q, mode: "insensitive" } },
            { note: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const txns = await prisma.transaction.findMany({
    where,
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    include: {
      property: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { entries: true } },
    },
  });

  const hasMore = txns.length > take;
  const slice = hasMore ? txns.slice(0, take) : txns;
  const nextCursor = hasMore ? slice[slice.length - 1]?.id ?? null : null;

  const rows: TxnListRow[] = slice.map((t) => ({
    id: t.id,
    type: t.type,
    occurredAt: t.occurredAt,
    propertyId: t.propertyId,
    propertyName: t.property.name,
    vendorId: t.vendorId ?? null,
    vendorName: t.vendor?.name ?? null,
    reference: t.reference ?? null,
    note: t.note ?? null,
    createdByName: t.createdBy?.name ?? t.createdBy?.email ?? null,
    entryCount: t._count.entries,
    voidedAt: t.voidedAt ?? null,
  }));

  return { ok: true as const, rows, nextCursor, from, to };
}
