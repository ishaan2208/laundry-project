"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordStockAuditSnapshot } from "@/actions/reports/recordStockAuditSnapshot";

export function StockAuditRecordButton(props: {
  propertyId: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    setPending(true);
    try {
      const r = await recordStockAuditSnapshot({
        propertyId: props.propertyId,
        includeVendor: props.includeVendor,
        includeDiscarded: props.includeDiscarded,
      });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success("Snapshot saved for this week.");
      router.refresh();
    } catch {
      toast.error("Could not save snapshot.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" size="lg" disabled={pending} onClick={onClick}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Camera className="size-4" />
      )}
      {pending ? "Saving…" : "Record snapshot"}
    </Button>
  );
}
