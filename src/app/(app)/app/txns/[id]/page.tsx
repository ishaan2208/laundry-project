import { requireUser, isAdmin } from "@/lib/auth";
import { TxnType } from "@/generated/prisma";
import { getTransactionById } from "@/actions/reports/getTransactionById";
import { PageHeader } from "@/components/mobile/PageHeader";
import { StatusPill } from "@/components/mobile/StatusPill";
import { VoidTxnButton } from "./void-button";
import { CopyTxnSummaryButton } from "@/components/reports/CopyTxnSummaryButton";
import { txnLabel } from "@/lib/txnLabels";
import { format } from "date-fns";
import { NotebookText, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const locationLabels: Record<string, string> = {
  CLEAN_STORE: "Ready to use",
  SOILED_STORE: "To be washed",
  REWASH_BIN: "Wash again",
  DAMAGED_BIN: "Damaged",
  DISCARDED_LOST: "Thrown away / lost",
  VENDOR: "At the laundry",
};

function fmt(dt: Date) {
  return format(dt, "d MMM yyyy, hh:mm a");
}

export default async function TxnDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const user = await requireUser();
  const { id } = (await params) as { id: string };
  const res = await getTransactionById(id);

  if (!res.ok) {
    return (
      <div className="min-h-dvh bg-background">
        <PageHeader title="Entry" />
        <div className="mx-auto w-full max-w-md px-4 pt-4">
          <div className="surface rounded-2xl p-5 text-center text-sm text-muted-foreground">
            {res.message ?? "This entry could not be found."}
          </div>
        </div>
      </div>
    );
  }

  const t = res.txn;
  const voided = Boolean(t.voidedAt);
  const shareable =
    t.type === TxnType.DISPATCH_TO_LAUNDRY ||
    t.type === TxnType.RECEIVE_FROM_LAUNDRY;

  return (
    <div className="min-h-dvh bg-background pb-8">
      <PageHeader title={txnLabel(t.type)} subtitle={fmt(new Date(t.occurredAt))} />

      <main className="mx-auto w-full max-w-md space-y-4 px-4 pt-4">
        {/* Who and where */}
        <section className="surface rounded-2xl p-4">
          <dl className="space-y-2.5 text-base">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Hotel</dt>
              <dd className="min-w-0 truncate font-semibold">
                {t.property.name}
              </dd>
            </div>
            {t.vendor?.name ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Laundry</dt>
                <dd className="min-w-0 truncate font-semibold">
                  {t.vendor.name}
                </dd>
              </div>
            ) : null}
            {t.reference ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="min-w-0 truncate font-semibold">
                  {t.reference}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd
                className={cn(
                  "font-semibold",
                  voided ? "text-damaged" : "text-clean"
                )}
              >
                {voided ? "Cancelled" : "Saved"}
              </dd>
            </div>
          </dl>

          {t.reversal ? (
            <Link
              href={`/app/txns/${t.reversal.id}`}
              className="mt-3 block text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              View the cancelling entry
            </Link>
          ) : null}
        </section>

        {/* What moved */}
        <section aria-label="Items" className="surface rounded-2xl">
          <h2 className="px-4 pb-1 pt-4 text-base font-bold">What moved</h2>
          <ul className="divide-y divide-border">
            {t.entries.map((e) => {
              const isPos = e.qtyDelta >= 0;
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium">
                      {e.linenItem.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                      <span>
                        {isPos ? "Into" : "Out of"}{" "}
                        {locationLabels[e.location.kind] ?? e.location.name}
                        {e.location.vendorName
                          ? ` (${e.location.vendorName})`
                          : ""}
                      </span>
                      <StatusPill
                        condition={e.condition as any}
                        className="px-2 py-0.5"
                      />
                    </div>
                  </div>
                  <span
                    data-numeric
                    className={cn(
                      "text-lg font-bold",
                      isPos ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {isPos ? `+${e.qtyDelta}` : e.qtyDelta}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Note */}
        {t.note ? (
          <section className="surface rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <NotebookText className="size-4" />
              Note
            </div>
            <p className="mt-2 whitespace-pre-wrap text-base">{t.note}</p>
          </section>
        ) : null}

        {/* Cancelled info */}
        {voided ? (
          <section className="rounded-2xl border border-damaged/25 bg-damaged-soft p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-damaged">
              <ShieldAlert className="size-4" />
              Cancelled {fmt(new Date(t.voidedAt!))}
              {t.voidedBy?.name ? ` by ${t.voidedBy.name}` : ""}
            </div>
            {t.voidReason ? (
              <p className="mt-1.5 text-sm text-damaged/90">{t.voidReason}</p>
            ) : null}
          </section>
        ) : null}

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {shareable ? (
            <CopyTxnSummaryButton
              txn={{
                id: t.id,
                type: t.type,
                occurredAt: t.occurredAt,
                reference: t.reference ?? undefined,
                propertyName: t.property.name,
                vendorName: t.vendor?.name ?? undefined,
                propertyId: t.property.id,
                vendorId: t.vendor?.id,
                entries: t.entries.map((e) => ({
                  linenItemName: e.linenItem.name,
                  condition: e.condition,
                  qtyDelta: e.qtyDelta,
                })),
              }}
            />
          ) : null}

          {isAdmin(user) && !voided ? (
            <VoidTxnButton txnId={t.id} disabled={false} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
