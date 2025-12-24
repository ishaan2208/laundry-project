"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { voidTransactionAction } from "@/actions/transactions/voidTransaction";

export function VoidTxnButton({
  txnId,
  disabled,
}: {
  txnId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  async function onVoid() {
    const res = await voidTransactionAction({
      transactionId: txnId,
      reason: reason.trim(),
    });
    if (res?.ok) {
      setOpen(false);
      router.refresh();
      return;
    }

    let msg = "Failed to void.";
    if (res && typeof res === "object") {
      if ("message" in res && typeof (res as any).message === "string") {
        msg = (res as any).message;
      } else if (
        "error" in res &&
        res.error &&
        typeof res.error.message === "string"
      ) {
        msg = res.error.message;
      }
    }

    alert(msg);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={disabled}>
          Void
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Void transaction?</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" variant="destructive" onClick={onVoid}>
              Confirm Void
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
