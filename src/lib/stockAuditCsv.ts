import type { StockAuditRow } from "@/actions/reports/types";
import { LinenCondition, LocationKind } from "@/generated/prisma";
import {
  STOCK_AUDIT_CONDITION_ORDER,
  visibleLocationKindsForAudit,
} from "@/lib/stockAuditConstants";

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function condQty(row: StockAuditRow, c: LinenCondition): number {
  return row.byCondition.find((x) => x.condition === c)?.qty ?? 0;
}

function kindQty(row: StockAuditRow, k: LocationKind): number {
  return row.byLocationKind.find((x) => x.locationKind === k)?.qty ?? 0;
}

function vendorBucketQty(row: StockAuditRow): number {
  return kindQty(row, LocationKind.VENDOR);
}

function nonVendorBucketQty(row: StockAuditRow): number {
  return row.totalQty - vendorBucketQty(row);
}

export function buildStockAuditCsv(opts: {
  propertyName: string;
  generatedAtIso: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
  rows: StockAuditRow[];
}): string {
  const kinds = visibleLocationKindsForAudit(
    opts.includeVendor,
    opts.includeDiscarded
  );

  const header = [
    "linen_item_id",
    "name",
    "sku",
    "total_qty",
    ...(opts.includeVendor ? ["vendor_qty", "non_vendor_qty"] : []),
    ...STOCK_AUDIT_CONDITION_ORDER.map((c) => `condition_${c}`),
    ...kinds.map((k) => `location_${k}`),
  ];

  const lines = [header.map(escapeCsvCell).join(",")];

  for (const row of opts.rows) {
    const cells = [
      row.linenItemId,
      row.linenItemName,
      row.sku ?? "",
      String(row.totalQty),
      ...(opts.includeVendor
        ? [
            String(vendorBucketQty(row)),
            String(nonVendorBucketQty(row)),
          ]
        : []),
      ...STOCK_AUDIT_CONDITION_ORDER.map((c) => String(condQty(row, c))),
      ...kinds.map((k) => String(kindQty(row, k))),
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  }

  const meta = [
    `# property: ${opts.propertyName}`,
    `# generated_at_utc: ${opts.generatedAtIso}`,
    `# include_vendor: ${opts.includeVendor}`,
    `# include_discarded_lost: ${opts.includeDiscarded}`,
  ];

  return `${meta.join("\n")}\n${lines.join("\n")}\n`;
}
