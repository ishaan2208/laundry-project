"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CalendarClock } from "lucide-react";
import { editTransactionEntriesAction } from "@/actions/transactions/editTransactionEntries";

const minDate = new Date(2018, 0, 1);

type EntryRow = { id: string; qtyAbs: number };

export function ChangeTxnOccurredDateForm(props: {
  transactionId: string;
  occurredAt: string;
  entries: EntryRow[];
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState(() => new Date(props.occurredAt));
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) {
      toast.error("Enter a reason (at least 3 characters).");
      return;
    }
    if (draft.getTime() < minDate.getTime()) {
      toast.error("Date is too far in the past.");
      return;
    }
    setSaving(true);
    try {
      const r = await editTransactionEntriesAction({
        transactionId: props.transactionId,
        reason: reason.trim(),
        occurredAt: draft.toISOString(),
        updates: props.entries.map((x) => ({
          entryId: x.id,
          qtyAbs: x.qtyAbs,
        })),
      });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success("Date updated — opening the replacement entry.");
      router.push(`/app/txns/${r.newTransactionId}`);
    } catch {
      toast.error("Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-3 rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            <CalendarClock className="h-4 w-4" />
          </span>
          Change dispatch / receive date
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Admin only. This voids the current entry and posts a replacement with the
          same quantities and a new <strong>occurred at</strong> time (for reports
          and calendars). The transaction id will change.
        </p>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            New date &amp; time
          </div>
          <DatePicker
            selected={draft}
            onChange={(d) => d && setDraft(d)}
            showTimeSelect
            timeIntervals={15}
            dateFormat="dd MMM yyyy, hh:mm aa"
            minDate={minDate}
            customInput={
              <Input className="h-12 rounded-2xl" readOnly placeholder="Pick date" />
            }
          />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            Reason (required)
          </div>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. DC dated wrong — correct to challan date"
            className="h-12 rounded-2xl"
            disabled={saving}
          />
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl bg-violet-600 text-white hover:bg-violet-600/90 dark:bg-violet-500 dark:hover:bg-violet-500/90"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save new date"}
        </Button>
      </form>
    </Card>
  );
}
