"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
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
      toast.success("Snapshot saved for this IST week.");
      router.refresh();
    } catch {
      toast.error("Could not save snapshot.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="default"
      className="h-11 rounded-2xl bg-violet-600 hover:bg-violet-600/90"
      disabled={pending}
      onClick={onClick}
    >
      <Camera className="mr-2 h-4 w-4" />
      {pending ? "Saving…" : "Record snapshot"}
    </Button>
  );
}
