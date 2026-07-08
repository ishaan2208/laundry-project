"use server";

import { prisma } from "@/lib/db";
import { requireUser, requirePropertyAccess } from "@/lib/auth";
import { TxnType } from "@/generated/prisma";

/**
 * The laundry vendor from this hotel's most recent send/receive. Used to
 * pre-select the vendor in the dispatch and receive flows so staff don't
 * pick it every time — works on any device and for any staff member,
 * because it reads the real last transaction, not local storage.
 */
export async function getLastVendorForProperty(input: {
  propertyId: string;
}): Promise<
  { ok: true; vendorId: string | null } | { ok: false; message: string }
> {
  try {
    const user = await requireUser();
    await requirePropertyAccess(user, input.propertyId);

    const txn = await prisma.transaction.findFirst({
      where: {
        propertyId: input.propertyId,
        vendorId: { not: null },
        voidedAt: null,
        type: {
          in: [
            TxnType.DISPATCH_TO_LAUNDRY,
            TxnType.RECEIVE_FROM_LAUNDRY,
            TxnType.RESEND_REWASH,
          ],
        },
        // Only vendors still active can be pre-selected.
        vendor: { isActive: true },
      },
      orderBy: { occurredAt: "desc" },
      select: { vendorId: true },
    });

    return { ok: true, vendorId: txn?.vendorId ?? null };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Could not load last vendor." };
  }
}
