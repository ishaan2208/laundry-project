import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getTransactionById } from "@/actions/reports/getTransactionById";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VoidTxnButton } from "./void-button";

function label(v: string) {
  return v.replaceAll("_", " ");
}

export default async function TxnDetailPage({
  params,
}: {
  // `params` may be a Promise in newer Next.js versions so accept a Promise and
  // await it before accessing properties.
  params: Promise<{ id: string }> | { id: string };
}) {
  const user = await requireUser();
  const { id } = (await params) as { id: string };
  const res = await getTransactionById(id);

  if (!res.ok)
    return <Card className="p-4 text-sm">{res.message ?? "Not found."}</Card>;

  const t = res.txn;

  return (
    <div className="mx-auto w-full max-w-2xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">{label(t.type)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t.property.name}
            {t.vendor?.name ? ` · ${t.vendor.name}` : ""} ·{" "}
            {new Date(t.occurredAt).toLocaleString()}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {t.reference ? (
              <Badge variant="secondary">Ref: {t.reference}</Badge>
            ) : null}
            {t.voidedAt ? (
              <Badge variant="destructive">Voided</Badge>
            ) : (
              <Badge variant="outline">Active</Badge>
            )}
            {t.reversal ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/txns/${t.reversal.id}`}>View reversal</Link>
              </Button>
            ) : null}
          </div>
        </div>

        {user.role === UserRole.ADMIN ? (
          <VoidTxnButton txnId={t.id} disabled={true || Boolean(t.voidedAt)} />
        ) : null}
      </div>

      {t.note ? (
        <Card className="mt-3 p-3 text-sm">
          <div className="text-xs text-muted-foreground">Note</div>
          <div className="mt-1 whitespace-pre-wrap">{t.note}</div>
        </Card>
      ) : null}

      {t.voidedAt ? (
        <Card className="mt-3 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive">Voided</Badge>
            <div className="text-xs text-muted-foreground">
              {new Date(t.voidedAt).toLocaleString()}
              {t.voidedBy?.name ? ` · by ${t.voidedBy.name}` : ""}
            </div>
          </div>
          {t.voidReason ? (
            <div className="mt-2 text-sm">Reason: {t.voidReason}</div>
          ) : null}
        </Card>
      ) : null}

      <Separator className="my-4" />

      <div className="text-sm font-semibold">Entries</div>
      <div className="mt-2 grid gap-2">
        {t.entries.map((e) => (
          <Card key={e.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {e.linenItem.name}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {e.location.name} · {label(e.location.kind)} ·{" "}
                  {label(e.condition)}
                  {e.location.vendorName ? ` · ${e.location.vendorName}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold tabular-nums">
                  {e.qtyDelta}
                </div>
                <div className="text-xs text-muted-foreground">qtyΔ</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
