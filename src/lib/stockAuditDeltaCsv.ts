import type { StockAuditSnapshotDetail } from "@/actions/reports/getStockAuditSnapshotWithDelta";

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildStockAuditDeltaCsv(detail: StockAuditSnapshotDetail): string {
  const header = [
    "linen_item_id",
    "name",
    "sku",
    "prior_audit_total",
    "current_audit_total",
    "delta",
  ];

  const lines = [header.map(escapeCsvCell).join(",")];

  for (const l of detail.lines) {
    const prior =
      l.prevTotalQty === null ? "" : String(l.prevTotalQty);
    const delta = l.delta === null ? "" : String(l.delta);
    const cells = [
      l.linenItemId,
      l.linenItemName,
      l.sku ?? "",
      prior,
      String(l.totalQty),
      delta,
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  }

  const meta = [
    `# property: ${detail.propertyName}`,
    `# current_week_start_ist: ${detail.weekStart.toISOString().slice(0, 10)}`,
    `# captured_at_utc: ${detail.capturedAt.toISOString()}`,
    `# prior_week_start_ist: ${detail.prevWeekStart?.toISOString().slice(0, 10) ?? "none"}`,
    `# include_vendor: ${detail.includeVendor}`,
    `# include_discarded: ${detail.includeDiscarded}`,
    `# changed_lines: ${detail.summary.changedLineCount}`,
    `# net_delta_pieces: ${detail.summary.netPiecesDelta ?? "n/a"}`,
  ];

  return `${meta.join("\n")}\n${lines.join("\n")}\n`;
}
