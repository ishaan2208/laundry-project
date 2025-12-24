import { LinenCondition } from "@prisma/client";
import { LocationKind } from "@prisma/client";
import { TxnType } from "@prisma/client";

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
