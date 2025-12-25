import Link from "next/link";
import { requireUser, isAdmin } from "@/lib/auth";
import { TxnType, UserRole } from "@prisma/client";
import { getTransactionById } from "@/actions/reports/getTransactionById";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VoidTxnButton } from "./void-button";
import { CopyTxnSummaryButton } from "@/components/reports/CopyTxnSummaryButton";
import {
  ArrowLeft,
  CalendarClock,
  Building2,
  Truck,
  Tag,
  NotebookText,
  ShieldAlert,
} from "lucide-react";

function label(v: string) {
  return v.replaceAll("_", " ");
}

function fmt(dt: Date) {
  return dt.toLocaleString();
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
      <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
        <div className="mx-auto w-full max-w-2xl p-3">
          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            {res.message ?? "Not found."}
          </Card>
        </div>
      </div>
    );
  }

  const t = res.txn;
  const shareable =
    t.type === TxnType.DISPATCH_TO_LAUNDRY ||
    t.type === TxnType.RECEIVE_FROM_LAUNDRY;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <div className="mx-auto w-full max-w-2xl p-3 pb-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <Button
            asChild
            variant="secondary"
            className="h-12 rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
          >
            <Link href="/app/txns">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Link>
          </Button>

          {shareable ? (
            <CopyTxnSummaryButton
              txn={{
                id: t.id,
                type: t.type,
                occurredAt: t.occurredAt,
                reference: t.reference ?? undefined,
                propertyName: t.property.name,
                vendorName: t.vendor?.name ?? undefined,
                entries: t.entries.map((e) => ({
                  linenItemName: e.linenItem.name,
                  condition: e.condition,
                  qtyDelta: e.qtyDelta,
                })),
              }}
            />
          ) : null}
        </div>

        {/* Header card */}
        <Card className="mt-3 rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    <Tag className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-lg font-semibold leading-tight">
                      {label(t.type)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Audit log entry
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                  >
                    <Building2 className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                    {t.property.name}
                  </Badge>

                  {t.vendor?.name ? (
                    <Badge
                      variant="secondary"
                      className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                    >
                      <Truck className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                      {t.vendor.name}
                    </Badge>
                  ) : null}

                  <Badge
                    variant="secondary"
                    className="rounded-2xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                  >
                    <CalendarClock className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                    {fmt(new Date(t.occurredAt))}
                  </Badge>

                  {t.reference ? (
                    <Badge variant="secondary" className="rounded-2xl">
                      Ref: {t.reference}
                    </Badge>
                  ) : null}

                  {t.voidedAt ? (
                    <Badge variant="destructive" className="rounded-2xl">
                      Voided
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-2xl border-violet-200/60 dark:border-violet-500/15"
                    >
                      Active
                    </Badge>
                  )}
                </div>

                {t.reversal ? (
                  <div className="mt-3">
                    <Button
                      asChild
                      variant="secondary"
                      className="h-12 rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                    >
                      <Link href={`/app/txns/${t.reversal.id}`}>
                        View reversal
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <VoidTxnButton
                  txnId={t.id}
                  disabled={Boolean(t.voidedAt) || !isAdmin(user)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Note */}
        {t.note ? (
          <Card className="mt-3 rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <NotebookText className="h-4 w-4" />
              Note
            </div>
            <div className="mt-2 whitespace-pre-wrap">{t.note}</div>
          </Card>
        ) : null}

        {/* Voided */}
        {t.voidedAt ? (
          <Card className="mt-3 rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="destructive" className="rounded-2xl">
                Voided
              </Badge>
              <div className="text-xs text-muted-foreground">
                {fmt(new Date(t.voidedAt))}
                {t.voidedBy?.name ? ` · by ${t.voidedBy.name}` : ""}
              </div>
            </div>
            {t.voidReason ? (
              <div className="mt-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Reason:
                </span>{" "}
                {t.voidReason}
              </div>
            ) : null}
          </Card>
        ) : null}

        <Separator className="my-5 opacity-60" />

        {/* Entries */}
        <div className="text-sm font-semibold">Entries</div>
        <div className="mt-2 grid gap-2">
          {t.entries.map((e) => {
            const isPos = e.qtyDelta >= 0;
            return (
              <Card
                key={e.id}
                className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      {e.linenItem.name}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {e.location.name} · {label(e.location.kind)} ·{" "}
                      {label(e.condition)}
                      {e.location.vendorName
                        ? ` · ${e.location.vendorName}`
                        : ""}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={[
                        "text-lg font-semibold tabular-nums",
                        isPos
                          ? "text-violet-700 dark:text-violet-200"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {e.qtyDelta}
                    </div>
                    <div className="text-xs text-muted-foreground">qtyΔ</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
