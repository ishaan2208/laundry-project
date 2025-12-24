import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TxnListRow } from "@/actions/reports/types";

function typeLabel(t: string) {
  return t.replaceAll("_", " ");
}

export function TxnListItem({ row }: { row: TxnListRow }) {
  return (
    <Link href={`/app/txns/${row.id}`} className="block">
      <Card className="p-3 max-w-[94vw] hover:bg-accent hover:underline">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{typeLabel(row.type)}</Badge>
              {row.voidedAt ? (
                <Badge variant="destructive">Voided</Badge>
              ) : null}
            </div>

            <div className="mt-2 truncate text-sm font-medium">
              {row.propertyName}
              {row.vendorName ? ` · ${row.vendorName}` : ""}
            </div>

            <div className="mt-1 truncate text-xs text-muted-foreground">
              {new Date(row.occurredAt).toLocaleString()}
              {row.reference ? ` · Ref: ${row.reference}` : ""}
            </div>

            {row.note ? (
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {row.note}
              </div>
            ) : null}
          </div>

          <div className="text-right text-xs text-muted-foreground">
            <div className="tabular-nums">{row.entryCount} lines</div>
            {row.createdByName ? (
              <div className="mt-1 truncate">{row.createdByName}</div>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
