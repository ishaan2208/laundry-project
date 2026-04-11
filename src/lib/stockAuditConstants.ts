import { LinenCondition, LocationKind } from "@/generated/prisma";

export const STOCK_AUDIT_CONDITION_ORDER: LinenCondition[] = [
  LinenCondition.CLEAN,
  LinenCondition.SOILED,
  LinenCondition.REWASH,
  LinenCondition.DAMAGED,
];

export const STOCK_AUDIT_KIND_ORDER: LocationKind[] = [
  LocationKind.CLEAN_STORE,
  LocationKind.SOILED_STORE,
  LocationKind.REWASH_BIN,
  LocationKind.DAMAGED_BIN,
  LocationKind.VENDOR,
  LocationKind.DISCARDED_LOST,
];

export function visibleLocationKindsForAudit(
  includeVendor: boolean,
  includeDiscarded: boolean
): LocationKind[] {
  return STOCK_AUDIT_KIND_ORDER.filter(
    (k) =>
      (includeVendor || k !== LocationKind.VENDOR) &&
      (includeDiscarded || k !== LocationKind.DISCARDED_LOST)
  );
}
