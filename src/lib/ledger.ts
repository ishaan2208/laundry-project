// src/lib/ledger.ts
import "server-only";

import { Prisma, LocationKind, TxnType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

/**
 * Ledger Result shape (server-action friendly)
 */
export type LedgerOk<T> = { ok: true; data: T };
export type LedgerErr = {
  ok: false;
  error: {
    code:
      | "VALIDATION_ERROR"
      | "NOT_FOUND"
      | "CONFLICT"
      | "INSUFFICIENT_STOCK"
      | "ALREADY_VOIDED"
      | "FORBIDDEN"
      | "UNKNOWN";
    message: string;
    details?: unknown;
  };
};
export type LedgerResult<T> = LedgerOk<T> | LedgerErr;

const cuidSchema = z.string().cuid();

/**
 * Input schemas (small + reusable)
 */
export const TxnEntryInputSchema = z.object({
  locationId: cuidSchema,
  linenItemId: cuidSchema,
  condition: z.enum(["CLEAN", "SOILED", "REWASH", "DAMAGED"]),
  qtyDelta: z
    .number()
    .int()
    .refine((v) => v !== 0, "qtyDelta cannot be 0"),
  unitCost: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => (v === undefined ? undefined : String(v))),
  meta: z.unknown().optional(),
});

export const PostTransactionInputSchema = z.object({
  type: z.enum([
    "PROCUREMENT",
    "DISPATCH_TO_LAUNDRY",
    "RECEIVE_FROM_LAUNDRY",
    "RESEND_REWASH",
    "DISCARD_LOST",
    "ADJUSTMENT",
    "VOID_REVERSAL",
  ]),
  propertyId: cuidSchema,
  vendorId: cuidSchema.optional(),
  reference: z.string().trim().min(1).max(80).optional(),
  note: z.string().trim().min(1).max(400).optional(),
  occurredAt: z.coerce.date().optional(),
  createdById: cuidSchema,
  idempotencyKey: z.string().trim().min(6).max(80).optional(),
  entries: z.array(TxnEntryInputSchema).min(1, "At least 1 entry required"),
});

export type PostTransactionInput = z.infer<typeof PostTransactionInputSchema>;

export const VoidTransactionInputSchema = z.object({
  transactionId: cuidSchema,
  voidedById: cuidSchema,
  reason: z.string().trim().min(3).max(200),
  occurredAt: z.coerce.date().optional(), // reversal occurredAt (default: now)
});
export type VoidTransactionInput = z.infer<typeof VoidTransactionInputSchema>;

type StrictStockOptions = {
  enabled?: boolean;
  /**
   * If enabled, we’ll block negative balances for these location kinds (by default: all kinds).
   * If you want to allow negatives for some kinds, list them here.
   */
  allowNegativeKinds?: LocationKind[];
  /**
   * If true, we take a Postgres advisory lock per property while checking+posting
   * to reduce race conditions in concurrent postings.
   */
  lockPerProperty?: boolean;
};

type PostTxnOptions = {
  strictStock?: StrictStockOptions;
};

function err(
  code: LedgerErr["error"]["code"],
  message: string,
  details?: unknown
): LedgerErr {
  return { ok: false, error: { code, message, details } };
}

/**
 * Deterministic 2x int32 hash for Postgres advisory locks (pg_advisory_xact_lock(int,int))
 */
function fnv1a32(str: string, seed = 0x811c9dc5) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // convert to signed int32 range
  return (h | 0) as number;
}
function lockKeysForProperty(propertyId: string) {
  const k1 = fnv1a32(propertyId, 0x811c9dc5);
  const k2 = fnv1a32(propertyId, 0x811c9dc5 ^ 0x9e3779b9);
  return [k1, k2] as const;
}

/**
 * Core posting helper:
 * - validates inputs + location/property/vendor consistency
 * - optional idempotency (createdById + idempotencyKey)
 * - optional strict stock check (best-effort; can also lock per property)
 * - writes Transaction + TransactionEntry rows atomically
 */
export async function postTransaction(
  raw: PostTransactionInput,
  opts: PostTxnOptions = {}
): Promise<
  LedgerResult<{
    transactionId: string;
    idempotent: boolean;
  }>
> {
  const parsed = PostTransactionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      "VALIDATION_ERROR",
      "Invalid transaction input",
      parsed.error.flatten()
    );
  }

  const input = parsed.data;
  const strict = opts.strictStock ?? {};
  const allowNegativeKinds = new Set(strict.allowNegativeKinds ?? []);

  // quick qty sanity
  for (const e of input.entries) {
    if (Math.abs(e.qtyDelta) > 1_000_000) {
      return err("VALIDATION_ERROR", "qtyDelta too large", { entry: e });
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ✅ idempotency (fast-path)
      if (input.idempotencyKey) {
        const existing = await tx.transaction.findFirst({
          where: {
            createdById: input.createdById,
            idempotencyKey: input.idempotencyKey,
          },
          select: { id: true },
        });
        if (existing) {
          return { transactionId: existing.id, idempotent: true };
        }
      }

      // Optional: lock per property to reduce concurrent negative-race
      if (strict.enabled && strict.lockPerProperty) {
        const [k1, k2] = lockKeysForProperty(input.propertyId);
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${k1}, ${k2});`;
      }

      // Validate vendor if provided
      if (input.vendorId) {
        const v = await tx.vendor.findFirst({
          where: { id: input.vendorId, isActive: true },
          select: { id: true },
        });
        if (!v)
          return err("NOT_FOUND", "Vendor not found or inactive", {
            vendorId: input.vendorId,
          });
      }

      // Fetch locations used
      const locationIds = Array.from(
        new Set(input.entries.map((e) => e.locationId))
      );
      const locations = await tx.location.findMany({
        where: { id: { in: locationIds } },
        select: {
          id: true,
          propertyId: true,
          kind: true,
          vendorId: true,
          isActive: true,
        },
      });

      if (locations.length !== locationIds.length) {
        const found = new Set(locations.map((l) => l.id));
        const missing = locationIds.filter((id) => !found.has(id));
        return err("NOT_FOUND", "One or more locations not found", { missing });
      }

      for (const l of locations) {
        if (!l.isActive)
          return err("CONFLICT", "Location is inactive", { locationId: l.id });
        if (l.propertyId !== input.propertyId) {
          return err("VALIDATION_ERROR", "Location property mismatch", {
            locationId: l.id,
            expectedPropertyId: input.propertyId,
            actualPropertyId: l.propertyId,
          });
        }
      }

      // Vendor/location consistency rules (strict but practical):
      const locById = new Map(locations.map((l) => [l.id, l] as const));
      const usesVendorLoc = input.entries.some(
        (e) => locById.get(e.locationId)?.kind === "VENDOR"
      );
      if (usesVendorLoc && !input.vendorId) {
        return err(
          "VALIDATION_ERROR",
          "vendorId is required when using a VENDOR location"
        );
      }
      if (input.vendorId) {
        for (const e of input.entries) {
          const l = locById.get(e.locationId)!;
          if (l.kind === "VENDOR") {
            if (!l.vendorId) {
              return err("CONFLICT", "VENDOR location missing vendorId", {
                locationId: l.id,
              });
            }
            if (l.vendorId !== input.vendorId) {
              return err(
                "VALIDATION_ERROR",
                "Vendor location vendorId mismatch",
                {
                  locationId: l.id,
                  expectedVendorId: input.vendorId,
                  actualVendorId: l.vendorId,
                }
              );
            }
          }
        }
      }

      // Validate linen items exist + active
      const itemIds = Array.from(
        new Set(input.entries.map((e) => e.linenItemId))
      );
      const items = await tx.linenItem.findMany({
        where: { id: { in: itemIds }, isActive: true },
        select: { id: true },
      });
      if (items.length !== itemIds.length) {
        const found = new Set(items.map((i) => i.id));
        const missing = itemIds.filter((id) => !found.has(id));
        return err(
          "NOT_FOUND",
          "One or more linen items not found or inactive",
          { missing }
        );
      }

      // ✅ Optional strict stock check (best-effort)
      if (strict.enabled) {
        const protectNeg = input.entries.filter((e) => {
          if (e.qtyDelta >= 0) return false;
          const kind = locById.get(e.locationId)!.kind;
          return !allowNegativeKinds.has(kind);
        });

        if (protectNeg.length > 0) {
          // Build key set
          const needed = new Map<string, number>(); // key -> total delta (negative)
          for (const e of protectNeg) {
            const key = `${input.propertyId}|${e.locationId}|${e.linenItemId}|${e.condition}`;
            needed.set(key, (needed.get(key) ?? 0) + e.qtyDelta);
          }

          const locIds = Array.from(
            new Set(protectNeg.map((e) => e.locationId))
          );
          const itIds = Array.from(
            new Set(protectNeg.map((e) => e.linenItemId))
          );

          const current = await tx.transactionEntry.groupBy({
            by: ["propertyId", "locationId", "linenItemId", "condition"],
            where: {
              propertyId: input.propertyId,
              locationId: { in: locIds },
              linenItemId: { in: itIds },
            },
            _sum: { qtyDelta: true },
          });

          const curMap = new Map<string, number>();
          for (const g of current) {
            const key = `${g.propertyId}|${g.locationId}|${g.linenItemId}|${g.condition}`;
            curMap.set(key, g._sum.qtyDelta ?? 0);
          }

          const violations: Array<{
            locationId: string;
            linenItemId: string;
            condition: string;
            currentQty: number;
            attemptedDelta: number;
            resultingQty: number;
          }> = [];

          for (const [key, delta] of needed.entries()) {
            const [_, locationId, linenItemId, condition] = key.split("|");
            const curQty = curMap.get(key) ?? 0;
            const resulting = curQty + delta; // delta is negative
            if (resulting < 0) {
              violations.push({
                locationId,
                linenItemId,
                condition,
                currentQty: curQty,
                attemptedDelta: delta,
                resultingQty: resulting,
              });
            }
          }

          if (violations.length > 0) {
            return err(
              "INSUFFICIENT_STOCK",
              "Posting would make stock negative",
              { violations }
            );
          }
        }
      }

      // ✅ Create transaction + entries atomically
      const created = await tx.transaction.create({
        data: {
          type: input.type as TxnType,
          propertyId: input.propertyId,
          vendorId: input.vendorId,
          reference: input.reference,
          note: input.note,
          occurredAt: input.occurredAt ?? new Date(),
          createdById: input.createdById,
          idempotencyKey: input.idempotencyKey,
          entries: {
            createMany: {
              data: input.entries.map((e) => ({
                propertyId: input.propertyId,
                locationId: e.locationId,
                linenItemId: e.linenItemId,
                condition: e.condition,
                qtyDelta: e.qtyDelta,
                unitCost: e.unitCost as unknown as Prisma.Decimal | undefined,
                meta: e.meta as Prisma.InputJsonValue | undefined,
              })),
            },
          },
        },
        select: { id: true },
      });

      return { transactionId: created.id, idempotent: false };
    });

    // If transaction callback returned a LedgerErr, pass it through
    if ((result as any)?.ok === false) return result as LedgerErr;

    return {
      ok: true,
      data: result as { transactionId: string; idempotent: boolean },
    };
  } catch (e: any) {
    // ✅ idempotency race: unique constraint hit (createdById + idempotencyKey)
    if (e?.code === "P2002") {
      const target = e?.meta?.target as string[] | undefined;
      if (
        target?.includes("createdById") &&
        target?.includes("idempotencyKey") &&
        raw.idempotencyKey
      ) {
        const existing = await prisma.transaction.findFirst({
          where: {
            createdById: raw.createdById,
            idempotencyKey: raw.idempotencyKey,
          },
          select: { id: true },
        });
        if (existing)
          return {
            ok: true,
            data: { transactionId: existing.id, idempotent: true },
          };
      }
      if (target?.includes("reversalOfId")) {
        return err(
          "CONFLICT",
          "A reversal already exists for this transaction"
        );
      }
    }

    return err("UNKNOWN", "Failed to post transaction", {
      message: e?.message,
      code: e?.code,
    });
  }
}

/**
 * Void/Reversal:
 * - marks original txn voidedAt/voidReason/voidedById
 * - creates reversal txn (type VOID_REVERSAL) with negated entries
 * - never deletes anything
 */
export async function voidTransaction(raw: VoidTransactionInput): Promise<
  LedgerResult<{
    originalId: string;
    reversalId: string;
  }>
> {
  const parsed = VoidTransactionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      "VALIDATION_ERROR",
      "Invalid void input",
      parsed.error.flatten()
    );
  }
  const input = parsed.data;

  try {
    const res = await prisma.$transaction(async (tx) => {
      const original = await tx.transaction.findUnique({
        where: { id: input.transactionId },
        include: { entries: true },
      });

      if (!original)
        return err("NOT_FOUND", "Transaction not found", {
          transactionId: input.transactionId,
        });

      if (original.type === "VOID_REVERSAL" || original.reversalOfId) {
        return err("CONFLICT", "Cannot void a reversal transaction", {
          transactionId: original.id,
        });
      }

      if (original.voidedAt) {
        return err("ALREADY_VOIDED", "Transaction already voided", {
          transactionId: original.id,
          voidedAt: original.voidedAt,
        });
      }

      // if a reversal already exists (extra safety even with @@unique([reversalOfId]))
      const existingReversal = await tx.transaction.findFirst({
        where: { reversalOfId: original.id },
        select: { id: true },
      });
      if (existingReversal) {
        return err(
          "CONFLICT",
          "A reversal already exists for this transaction",
          {
            reversalId: existingReversal.id,
          }
        );
      }

      if (!original.entries.length) {
        return err("CONFLICT", "Cannot void a transaction with no entries", {
          transactionId: original.id,
        });
      }

      // mark original as voided
      await tx.transaction.update({
        where: { id: original.id },
        data: {
          voidedAt: new Date(),
          voidReason: input.reason,
          voidedById: input.voidedById,
        },
      });

      // create reversal
      const reversal = await tx.transaction.create({
        data: {
          type: "VOID_REVERSAL",
          propertyId: original.propertyId,
          vendorId: original.vendorId,
          reference: original.reference
            ? `VOID:${original.reference}`
            : `VOID:${original.id}`,
          note: `Reversal of ${original.id}. Reason: ${input.reason}`,
          occurredAt: input.occurredAt ?? new Date(),
          createdById: input.voidedById,
          reversalOfId: original.id,
          entries: {
            createMany: {
              data: original.entries.map((e) => ({
                propertyId: e.propertyId,
                locationId: e.locationId,
                linenItemId: e.linenItemId,
                condition: e.condition,
                qtyDelta: -e.qtyDelta,
                unitCost: e.unitCost,
                meta: e.meta as Prisma.InputJsonValue | undefined,
              })),
            },
          },
        },
        select: { id: true },
      });

      return { originalId: original.id, reversalId: reversal.id };
    });

    if ((res as any)?.ok === false) return res as LedgerErr;
    return {
      ok: true,
      data: res as { originalId: string; reversalId: string },
    };
  } catch (e: any) {
    if (e?.code === "P2002") {
      const target = e?.meta?.target as string[] | undefined;
      if (target?.includes("reversalOfId")) {
        return err(
          "CONFLICT",
          "A reversal already exists for this transaction"
        );
      }
    }
    return err("UNKNOWN", "Failed to void transaction", {
      message: e?.message,
      code: e?.code,
    });
  }
}
