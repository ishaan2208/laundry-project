import type { StockAuditRow } from "@/actions/reports/types";
import { LocationKind } from "@/generated/prisma";

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function atLaundry(row: StockAuditRow): number {
  return (
    row.byLocationKind.find((x) => x.locationKind === LocationKind.VENDOR)
      ?.qty ?? 0
  );
}

/**
 * Weekly totals as a spreadsheet, in the same three numbers the app shows:
 * with you (at the hotel), at the laundry, and total. No internal condition
 * or location buckets — they don't form a complete circle and only confuse.
 */
export function buildStockAuditCsv(opts: {
  propertyName: string;
  generatedAtIso: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
  rows: StockAuditRow[];
}): string {
  const header = [
    "linen_item_id",
    "name",
    "sku",
    "with_you_qty",
    "at_laundry_qty",
    "total_qty",
  ];

  const lines = [header.map(escapeCsvCell).join(",")];

  for (const row of opts.rows) {
    const out = atLaundry(row);
    const cells = [
      row.linenItemId,
      row.linenItemName,
      row.sku ?? "",
      String(row.totalQty - out),
      String(out),
      String(row.totalQty),
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  }

  const meta = [
    `# property: ${opts.propertyName}`,
    `# generated_at_utc: ${opts.generatedAtIso}`,
    `# with_you = at the hotel, at_laundry = sent and not yet back, total = both`,
  ];

  return `${meta.join("\n")}\n${lines.join("\n")}\n`;
}
