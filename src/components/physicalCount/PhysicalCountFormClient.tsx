"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CounterList, CounterRow } from "@/components/mobile/CounterList";
import { StickyBar } from "@/components/mobile/StickyBar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { submitPhysicalStockCount } from "@/actions/physicalCount/submitPhysicalStockCount";

type Row = {
  linenItemId: string;
  name: string;
  sku: string | null;
  bookQty: number;
};

export function PhysicalCountFormClient(props: {
  propertyId: string;
  includeVendor: boolean;
  includeDiscarded: boolean;
  initialRows: Row[];
}) {
  const router = useRouter();

  const buildInitial = React.useCallback(() => {
    const m: Record<string, number> = {};
    for (const r of props.initialRows) m[r.linenItemId] = r.bookQty;
    return m;
  }, [props.initialRows]);

  const [qty, setQty] = React.useState<Record<string, number>>(buildInitial);
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);

  React.useEffect(() => {
    setQty(buildInitial());
  }, [buildInitial]);

  const differences = React.useMemo(
    () =>
      props.initialRows
        .map((r) => ({
          ...r,
          counted: qty[r.linenItemId] ?? 0,
          delta: (qty[r.linenItemId] ?? 0) - r.bookQty,
        }))
        .filter((r) => r.delta !== 0),
    [props.initialRows, qty]
  );

  async function onConfirm() {
    setPending(true);
    try {
      const lines = props.initialRows.map((r) => ({
        linenItemId: r.linenItemId,
        countedQty: qty[r.linenItemId] ?? 0,
      }));
      const res = await submitPhysicalStockCount({
        propertyId: props.propertyId,
        includeVendor: props.includeVendor,
        includeDiscarded: props.includeDiscarded,
        staffNote: note.trim() || undefined,
        lines,
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Count sent to admin for approval.");
      router.push(`/app/stock/physical-count/status/${res.id}`);
    } catch {
      toast.error("Could not send the count. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (props.initialRows.length === 0) {
    return (
      <div className="surface rounded-2xl p-5 text-center">
        <p className="text-base font-semibold">No linen items yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your admin needs to add items like bedsheets and towels first.
        </p>
      </div>
    );
  }

  return (
    <>
      <section aria-label="Count each item">
        <div className="px-1 pb-2">
          <h2 className="text-base font-bold">Count every item</h2>
          <p className="text-sm text-muted-foreground">
            The book number is pre-filled. Change it to what you really see.
          </p>
        </div>

        <CounterList>
          {props.initialRows.map((r) => {
            const counted = qty[r.linenItemId] ?? 0;
            const delta = counted - r.bookQty;
            return (
              <CounterRow
                key={r.linenItemId}
                name={r.name}
                meta={
                  <span className="inline-flex items-center gap-2">
                    <span>Book: {r.bookQty}</span>
                    {delta !== 0 ? (
                      <span
                        data-numeric
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-bold",
                          delta > 0
                            ? "bg-clean-soft text-clean"
                            : "bg-damaged-soft text-damaged"
                        )}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    ) : null}
                  </span>
                }
                value={counted}
                onChange={(next) =>
                  setQty((prev) => ({ ...prev, [r.linenItemId]: next }))
                }
              />
            );
          })}
        </CounterList>
      </section>

      <div className="space-y-2 pt-1">
        <Label htmlFor="staffNote" className="text-sm text-muted-foreground">
          Note for admin (optional)
        </Label>
        <Textarea
          id="staffNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="rounded-xl text-base"
          placeholder="e.g. counted after the morning rooms"
        />
      </div>

      <StickyBar>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div
              data-numeric
              className={cn(
                "text-2xl font-bold leading-tight",
                differences.length > 0 && "text-soiled"
              )}
            >
              {differences.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {differences.length === 1
                ? "item differs from book"
                : "items differ from book"}
            </div>
          </div>
          <Button
            size="xl"
            className="flex-1"
            disabled={pending}
            onClick={() => setReviewOpen(true)}
          >
            Review &amp; submit
          </Button>
        </div>
      </StickyBar>

      <Drawer open={reviewOpen} onOpenChange={setReviewOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {differences.length === 0
                ? "Everything matches the book"
                : `${differences.length} ${
                    differences.length === 1 ? "difference" : "differences"
                  } found`}
            </DrawerTitle>
            <DrawerDescription>
              An admin will check and approve this count.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="px-5">
            {differences.length === 0 ? (
              <p className="py-4 text-base text-muted-foreground">
                Your count is the same as the book for every item. Submit it to
                put that on record.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {differences.map((d) => (
                  <li
                    key={d.linenItemId}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium">
                        {d.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Book {d.bookQty} → you counted {d.counted}
                      </div>
                    </div>
                    <span
                      data-numeric
                      className={cn(
                        "rounded-full px-2.5 py-1 text-sm font-bold",
                        d.delta > 0
                          ? "bg-clean-soft text-clean"
                          : "bg-damaged-soft text-damaged"
                      )}
                    >
                      {d.delta > 0 ? `+${d.delta}` : d.delta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DrawerBody>

          <DrawerFooter className="space-y-2">
            <Button
              size="xl"
              className="w-full"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Sending…
                </>
              ) : (
                "Submit count for approval"
              )}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled={pending}
              onClick={() => setReviewOpen(false)}
            >
              Go back and change
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
