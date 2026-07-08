"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StockAuditRow } from "@/actions/reports/types";
import { buildStockAuditCsv } from "@/lib/stockAuditCsv";

function safeFilenamePart(name: string) {
  return name.replace(/[^\w\-]+/g, "-").replace(/^-+|-+$/g, "") || "property";
}

export function StockAuditDownloadButton(props: {
  propertyName: string;
  generatedAtIso: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
  rows: StockAuditRow[];
}) {
  function onClick() {
    const csv = buildStockAuditCsv({
      propertyName: props.propertyName,
      generatedAtIso: props.generatedAtIso,
      includeVendor: props.includeVendor,
      includeDiscarded: props.includeDiscarded,
      rows: props.rows,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = props.generatedAtIso.slice(0, 10);
    a.download = `stock-audit-${safeFilenamePart(props.propertyName)}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      onClick={onClick}
      disabled={!props.rows.length}
    >
      <Download className="size-4" />
      Export CSV
    </Button>
  );
}
