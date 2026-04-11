"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportStockAuditDeltaCsv } from "@/actions/reports/exportStockAuditDeltaCsv";

export function StockAuditDeltaCsvButton(props: { snapshotId: string }) {
  const [busy, setBusy] = React.useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const r = await exportStockAuditDeltaCsv(props.snapshotId);
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started.");
    } catch {
      toast.error("Export failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-full gap-1.5"
      disabled={busy}
      onClick={onClick}
    >
      <Download className="h-4 w-4" />
      {busy ? "Preparing…" : "Download CSV"}
    </Button>
  );
}
