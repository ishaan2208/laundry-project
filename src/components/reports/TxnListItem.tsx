import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TxnListRow } from "@/actions/reports/types";
import {
  ArrowRight,
  Building2,
  Truck,
  CalendarClock,
  User,
  FileText,
  ShieldAlert,
  Download,
  Upload,
  ScrollText,
} from "lucide-react";
import { TxnType } from "@prisma/client";

function typeLabel(t: string) {
  return t.replaceAll("_", " ");
}

function typeIcon(type: string) {
  if (type === TxnType.DISPATCH_TO_LAUNDRY)
    return <Upload className="h-4 w-4" />;
  if (type === TxnType.RECEIVE_FROM_LAUNDRY)
    return <Download className="h-4 w-4" />;
  return <ScrollText className="h-4 w-4" />;
}

function typeAccent(type: string) {
  if (type === TxnType.DISPATCH_TO_LAUNDRY)
    return "text-violet-700 dark:text-violet-200";
  if (type === TxnType.RECEIVE_FROM_LAUNDRY)
    return "text-violet-700 dark:text-violet-200";
  return "text-muted-foreground";
}

export function TxnListItem({ row }: { row: TxnListRow }) {
  return (
    <Link href={`/app/txns/${row.id}`} className="block">
      <Card
        className={[
          "rounded-3xl p-4",
          "border border-violet-200/60 bg-white/60 backdrop-blur-[2px]",
          "dark:border-violet-500/15 dark:bg-zinc-950/40",
          "transition-colors",
          "hover:bg-violet-600/10 dark:hover:bg-violet-500/10",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Top chips */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={[
                  "rounded-2xl border border-violet-200/60 bg-white/60 text-xs",
                  "backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40",
                ].join(" ")}
              >
                <span
                  className={[
                    "mr-1 inline-flex items-center",
                    typeAccent(row.type),
                  ].join(" ")}
                >
                  {typeIcon(row.type)}
                </span>
                {typeLabel(row.type)}
              </Badge>

              {row.voidedAt ? (
                <Badge variant="destructive" className="rounded-2xl">
                  <ShieldAlert className="mr-1 h-4 w-4" />
                  Voided
                </Badge>
              ) : null}

              {row.reference ? (
                <Badge
                  variant="secondary"
                  className={[
                    "rounded-2xl border border-violet-200/60 bg-white/60 text-xs",
                    "backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40",
                  ].join(" ")}
                >
                  <FileText className="mr-1 h-4 w-4 text-violet-700 dark:text-violet-200" />
                  Ref: {row.reference}
                </Badge>
              ) : null}
            </div>

            {/* Title line */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-violet-700 dark:text-violet-200" />
                <span className="truncate">{row.propertyName}</span>
              </span>

              {row.vendorName ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <span className="opacity-60">·</span>
                  <Truck className="h-4 w-4" />
                  <span className="truncate">{row.vendorName}</span>
                </span>
              ) : null}
            </div>

            {/* Meta */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" />
                {new Date(row.occurredAt).toLocaleString()}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <ScrollText className="h-4 w-4" />
                {row.entryCount} lines
              </span>

              {row.createdByName ? (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="truncate">{row.createdByName}</span>
                </span>
              ) : null}
            </div>

            {/* Note preview */}
            {row.note ? (
              <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {row.note}
              </div>
            ) : null}
          </div>

          {/* Chevron */}
          <div className="mt-1 shrink-0 rounded-2xl border border-violet-200/60 bg-white/60 p-2 text-violet-700 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40 dark:text-violet-200">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
