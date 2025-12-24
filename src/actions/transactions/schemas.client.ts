import { z } from "zod";

// Mirror of server schemas but safe to import from client (no @prisma/client)

const LinenConditionEnum = z.enum(["CLEAN", "SOILED", "REWASH", "DAMAGED"]);
const LocationKindEnum = z.enum([
  "CLEAN_STORE",
  "SOILED_STORE",
  "REWASH_BIN",
  "DAMAGED_BIN",
  "DISCARDED_LOST",
  "VENDOR",
]);

export const CreateProcurementSchema = z.object({
  propertyId: z.string().min(1),
  reference: z.string().trim().min(1).optional(),
  note: z.string().trim().optional(),
  occurredAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().min(8).optional(),
  lines: z
    .array(
      z.object({
        linenItemId: z.string().min(1),
        qty: z.number().int().positive(),
        unitCost: z.number().positive().optional(),
        meta: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .min(1),
});

export const DispatchToLaundrySchema = z.object({
  propertyId: z.string().min(1),
  vendorId: z.string().min(1),
  reference: z.string().trim().min(1).optional(),
  note: z.string().trim().optional(),
  occurredAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().min(8).optional(),
  lines: z
    .array(
      z.object({
        linenItemId: z.string().min(1),
        qty: z.number().int().positive(),
      })
    )
    .min(1),
});

export const ReceiveLineSchema = z
  .object({
    linenItemId: z.string().min(1),
    receivedCleanQty: z.number().int().nonnegative().optional(),
    damagedQty: z.number().int().nonnegative().optional(),
    rewashQty: z.number().int().nonnegative().optional(),
  })
  .refine(
    (l) =>
      (l.receivedCleanQty ?? 0) + (l.damagedQty ?? 0) + (l.rewashQty ?? 0) > 0,
    { message: "At least one qty is required" }
  );

export const ReceiveFromLaundrySchema = z.object({
  propertyId: z.string().min(1),
  vendorId: z.string().min(1),
  reference: z.string().trim().min(1).optional(),
  note: z.string().trim().optional(),
  occurredAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().min(8).optional(),
  lines: z.array(ReceiveLineSchema).min(1),
});

export const ResendRewashSchema = z.object({
  propertyId: z.string().min(1),
  vendorId: z.string().min(1),
  reference: z.string().trim().min(1).optional(),
  note: z.string().trim().optional(),
  occurredAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().min(8).optional(),
  lines: z
    .array(
      z.object({
        linenItemId: z.string().min(1),
        qty: z.number().int().positive(),
      })
    )
    .min(1),
});

export const DiscardLineSchema = z.object({
  linenItemId: z.string().min(1),
  qty: z.number().int().positive(),
  condition: LinenConditionEnum.optional(),
});

export const DiscardLostSchema = z
  .object({
    propertyId: z.string().min(1),

    sourceLocationId: z.string().min(1).optional(),
    sourceKind: LocationKindEnum.optional(),
    vendorId: z.string().min(1).optional(), // required if sourceKind=VENDOR and no sourceLocationId

    defaultCondition: LinenConditionEnum.optional(),

    reason: z.string().trim().min(2),
    reference: z.string().trim().min(1).optional(),
    note: z.string().trim().optional(),
    occurredAt: z.coerce.date().optional(),
    idempotencyKey: z.string().trim().min(8).optional(),

    lines: z.array(DiscardLineSchema).min(1),
  })
  .refine(
    (d) => d.sourceKind !== "VENDOR" || !!d.vendorId || !!d.sourceLocationId,
    {
      message:
        "vendorId required when sourceKind is VENDOR (unless sourceLocationId provided)",
    }
  );

export const AdjustmentLineSchema = z
  .object({
    locationId: z.string().min(1).optional(),
    locationKind: LocationKindEnum.optional(),
    vendorId: z.string().min(1).optional(),

    linenItemId: z.string().min(1),
    condition: LinenConditionEnum,
    qtyDelta: z
      .number()
      .int()
      .refine((v) => v !== 0, "qtyDelta cannot be 0"),
    meta: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((l) => !!l.locationId || !!l.locationKind, {
    message: "locationId or locationKind is required",
  })
  .refine(
    (l) => l.locationKind !== "VENDOR" || !!l.vendorId || !!l.locationId,
    {
      message: "vendorId required for VENDOR kind (unless locationId provided)",
    }
  );

export const CreateAdjustmentSchema = z.object({
  propertyId: z.string().min(1),
  reference: z.string().trim().min(1).optional(),
  note: z.string().trim().min(2),
  occurredAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().min(8).optional(),
  lines: z.array(AdjustmentLineSchema).min(1),
});
