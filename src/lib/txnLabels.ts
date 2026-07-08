/**
 * Plain hotel language for ledger transaction types.
 * Staff never see enum names like DISPATCH_TO_LAUNDRY.
 */
export type TxnTone = "soiled" | "clean" | "rewash" | "damaged" | "neutral";

export const txnLabels: Record<string, { label: string; tone: TxnTone }> = {
  DISPATCH_TO_LAUNDRY: { label: "Sent to laundry", tone: "soiled" },
  RECEIVE_FROM_LAUNDRY: { label: "Received from laundry", tone: "clean" },
  RESEND_REWASH: { label: "Sent back to wash again", tone: "rewash" },
  PROCUREMENT: { label: "New stock added", tone: "clean" },
  DISCARD_LOST: { label: "Thrown away / lost", tone: "damaged" },
  ADJUSTMENT: { label: "Stock correction", tone: "neutral" },
  VOID_REVERSAL: { label: "Entry cancelled", tone: "neutral" },
};

export function txnLabel(type: string) {
  return txnLabels[type]?.label ?? type.replaceAll("_", " ").toLowerCase();
}

export function txnTone(type: string): TxnTone {
  return txnLabels[type]?.tone ?? "neutral";
}
