// src/actions/transactions/voidTransaction.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { voidTransaction as voidTxn } from "@/lib/ledger";
import { requireUser } from "@/lib/auth"; // assume you’ll implement in Thread A

const VoidTxnActionInput = z.object({
  transactionId: z.string().cuid(),
  reason: z.string().trim().min(3).max(200),
});

export async function voidTransactionAction(
  input: z.infer<typeof VoidTxnActionInput>
) {
  const user = await requireUser(); // must return at least { id, role }
  if (user.role !== "ADMIN") {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "Only ADMIN can void transactions" },
    } as const;
  }

  const parsed = VoidTxnActionInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: parsed.error.flatten(),
      },
    } as const;
  }

  const res = await voidTxn({
    transactionId: parsed.data.transactionId,
    voidedById: user.id,
    reason: parsed.data.reason,
  });

  if (res.ok) {
    // adjust paths as needed
    revalidatePath("/txns");
    revalidatePath("/stock");
    revalidatePath("/vendors");
  }

  return res;
}
