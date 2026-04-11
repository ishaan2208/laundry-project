import { LinenCondition } from "@/generated/prisma";
import { LocationKind } from "@/generated/prisma";
import { TxnType } from "@/generated/prisma";

export type BalanceRow = {
  propertyId: string;
  locationId: string;
  locationName: string;
  locationKind: LocationKind;
  vendorId: string | null;
  vendorName: string | null;

  linenItemId: string;
  linenItemName: string;

  condition: LinenCondition;
  qty: number;
  isNegative: boolean;
};

export type VendorPendingItemRow = {
  linenItemId: string;
  linenItemName: string;
  condition: LinenCondition;
  qty: number;
};

export type VendorPendingVendorRow = {
  vendorId: string;
  vendorName: string;
  totalQty: number;
  soiledQty: number;
  rewashQty: number;
  otherQty: number;
  items: VendorPendingItemRow[];
};

export type TxnListRow = {
  id: string;
  type: TxnType;
  occurredAt: Date;

  propertyId: string;
  propertyName: string;

  vendorId: string | null;
  vendorName: string | null;

  reference: string | null;
  note: string | null;

  createdByName: string | null;

  entryCount: number;
  voidedAt: Date | null;
};

export type VendorTurnaroundRow = {
  vendorId: string;
  vendorName: string;
  sampleSize: number;
  avgHours: number | null; // null if insufficient data
};

export type StockAuditConditionSlice = {
  condition: LinenCondition;
  qty: number;
};

export type StockAuditLocationKindSlice = {
  locationKind: LocationKind;
  qty: number;
};

export type StockAuditRow = {
  linenItemId: string;
  linenItemName: string;
  sku: string | null;
  totalQty: number;
  byCondition: StockAuditConditionSlice[];
  byLocationKind: StockAuditLocationKindSlice[];
};

export type StockAuditRollupResult = {
  ok: true;
  generatedAt: string; // ISO
  propertyId: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
  rows: StockAuditRow[];
};
