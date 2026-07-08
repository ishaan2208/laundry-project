"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  const [busy, setBusy] = React.useState(false);

  async function onVoid() {
    setBusy(true);
    try {
      const res = await voidTransactionAction({
        transactionId: txnId,
        reason: reason.trim(),
      });
      if (res?.ok) {
        toast.success("Entry cancelled. Stock numbers are corrected.");
        setOpen(false);
        router.refresh();
        return;
      }

      let msg = "Could not cancel this entry.";
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
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="destructive" size="lg" disabled={disabled}>
          Cancel this entry
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Cancel this entry?</DrawerTitle>
          <DrawerDescription>
            The stock moves back as if this entry never happened. The register
            keeps both records.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="px-5">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why? (optional, e.g. entered twice)"
            className="rounded-xl text-base"
            rows={2}
            disabled={busy}
          />
        </DrawerBody>

        <DrawerFooter className="space-y-2">
          <Button
            variant="destructive"
            size="xl"
            className="w-full"
            onClick={onVoid}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Cancelling…
              </>
            ) : (
              "Yes, cancel entry"
            )}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Keep it
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
