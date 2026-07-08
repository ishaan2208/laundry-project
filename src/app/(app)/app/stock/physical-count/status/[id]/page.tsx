import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, isAdmin } from "@/lib/auth";
import { getPhysicalStockCountForSubmitter } from "@/actions/physicalCount/getPhysicalStockCount";
import { getPhysicalStockCount } from "@/actions/physicalCount/getPhysicalStockCount";
import { PageHeader } from "@/components/mobile/PageHeader";
import { PhysicalStockCountStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";

const statusLabel: Record<PhysicalStockCountStatus, string> = {
  PENDING_REVIEW: "Waiting for admin review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};

const statusStyle: Record<PhysicalStockCountStatus, string> = {
  PENDING_REVIEW: "bg-soiled-soft text-soiled",
  APPROVED: "bg-clean-soft text-clean",
  REJECTED: "bg-damaged-soft text-damaged",
};

export default async function PhysicalCountStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const detail = isAdmin(user)
    ? await getPhysicalStockCount(id)
    : await getPhysicalStockCountForSubmitter(id);

  if (!detail) notFound();

  return (
    <div className="min-h-dvh bg-background pb-8">
      <PageHeader
        title="Count submitted"
        subtitle={detail.propertyName}
        back
      />

      <main className="mx-auto w-full max-w-2xl space-y-4 px-4 pt-4">
        <section className="surface space-y-3 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                statusStyle[detail.status]
              )}
            >
              {statusLabel[detail.status]}
            </span>
          </div>

          {detail.staffNote ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Your note: </span>
              {detail.staffNote}
            </p>
          ) : null}

          {detail.reviewNote ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Admin note: </span>
              {detail.reviewNote}
            </p>
          ) : null}

          {detail.approvalTransactionId ? (
            <p className="text-sm text-muted-foreground">
              Ledger entry:{" "}
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                href={`/app/txns/${detail.approvalTransactionId}`}
              >
                Open entry
              </Link>
            </p>
          ) : null}
        </section>

        <section className="surface overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted text-left">
                  <th className="px-3 py-2.5 font-semibold">Item</th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Your count
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Approved
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Book
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.map((l) => {
                  const finalQty = l.approvedQty ?? l.countedQty;
                  const edited =
                    l.approvedQty !== null && l.approvedQty !== l.countedQty;
                  return (
                    <tr key={l.linenItemId} className="border-b last:border-0">
                      <td className="px-3 py-2.5">
                        {l.linenItemName}
                        {edited ? (
                          <span className="ml-1.5 text-xs font-medium text-soiled">
                            (adjusted by admin)
                          </span>
                        ) : null}
                      </td>
                      <td data-numeric className="px-3 py-2.5 text-right">
                        {l.countedQty}
                      </td>
                      <td
                        data-numeric
                        className="px-3 py-2.5 text-right font-semibold"
                      >
                        {finalQty}
                      </td>
                      <td
                        data-numeric
                        className="px-3 py-2.5 text-right text-muted-foreground"
                      >
                        {l.bookQtyAtSubmit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Approved</span> is
            what admin uses for the ledger (same as your count unless they
            change it). Linen at the laundry is not moved by approval — only
            ready-to-use stock is adjusted.
          </p>
        </section>
      </main>
    </div>
  );
}
