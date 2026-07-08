"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
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
      toast.error("Could not export this.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onClick}>
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {busy ? "Preparing…" : "Download CSV"}
    </Button>
  );
}
