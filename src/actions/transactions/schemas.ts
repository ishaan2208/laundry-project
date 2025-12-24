import { z } from "zod";
import { LinenCondition, LocationKind } from "@prisma/client";

// 1) Procurement
export const ProcurementLineSchema = z.object({
  linenItemId: z.string().min(1),
  qty: z.number().int().positive(),
  unitCost: z.number().positive().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const CreateProcurementSchema = z.object({
  propertyId: z.string().min(1),
  reference: z.string().trim().min(1).optional(),
  note: z.string().trim().optional(),
  occurredAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().min(8).optional(),
  lines: z.array(ProcurementLineSchema).min(1),
});

// 2) Dispatch to laundry
export const DispatchLineSchema = z.object({
  linenItemId: z.string().min(1),
  qty: z.number().int().positive(),
});

export const DispatchToLaundrySchema = z.object({
  propertyId: z.string().min(1),
  vendorId: z.string().min(1),
  reference: z.string().trim().min(1).optional(),
  note: z.string().trim().optional(),
  occurredAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().min(8).optional(),
  lines: z.array(DispatchLineSchema).min(1),
});

// 3) Receive from laundry
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

// 4) Resend rewash
export const ResendRewashSchema = z.object({
  propertyId: z.string().min(1),
  vendorId: z.string().min(1),
  reference: z.string().trim().min(1).optional(),
  note: z.string().trim().optional(),
  occurredAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().min(8).optional(),
  lines: z.array(DispatchLineSchema).min(1), // same as {linenItemId, qty}
});

// 5) Discard/Lost
export const DiscardLineSchema = z.object({
  linenItemId: z.string().min(1),
  qty: z.number().int().positive(),
  condition: z.nativeEnum(LinenCondition).optional(),
});

export const DiscardLostSchema = z
  .object({
    propertyId: z.string().min(1),

    sourceLocationId: z.string().min(1).optional(),
    sourceKind: z.nativeEnum(LocationKind).optional(),
    vendorId: z.string().min(1).optional(), // required if sourceKind=VENDOR and no sourceLocationId

    defaultCondition: z.nativeEnum(LinenCondition).optional(),

    reason: z.string().trim().min(2),
    reference: z.string().trim().min(1).optional(),
    note: z.string().trim().optional(),
    occurredAt: z.coerce.date().optional(),
    idempotencyKey: z.string().trim().min(8).optional(),

    lines: z.array(DiscardLineSchema).min(1),
  })
  .refine(
    (d) =>
      d.sourceKind !== LocationKind.VENDOR ||
      !!d.vendorId ||
      !!d.sourceLocationId,
    {
      message:
        "vendorId required when sourceKind is VENDOR (unless sourceLocationId provided)",
    }
  );

// 6) Adjustment (Admin)
export const AdjustmentLineSchema = z
  .object({
    locationId: z.string().min(1).optional(),
    locationKind: z.nativeEnum(LocationKind).optional(),
    vendorId: z.string().min(1).optional(),

    linenItemId: z.string().min(1),
    condition: z.nativeEnum(LinenCondition),
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
    (l) =>
      l.locationKind !== LocationKind.VENDOR || !!l.vendorId || !!l.locationId,
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
