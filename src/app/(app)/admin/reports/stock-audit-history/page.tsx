import Link from "next/link";
import { prisma } from "@/lib/db";
import { listStockAuditSnapshots } from "@/actions/reports/listStockAuditSnapshots";
import { getStockAuditSnapshotWithDelta } from "@/actions/reports/getStockAuditSnapshotWithDelta";
import { StockAuditDeltaCsvButton } from "@/components/reports/StockAuditDeltaCsvButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { History, Building2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = "/admin/reports/stock-audit-history";

function fmtIstDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
  }).format(d);
}

function fmtIstDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function scopeLabel(v: boolean, d: boolean) {
  const parts: string[] = [];
  parts.push(v ? "vendor" : "no vendor");
  parts.push(d ? "discarded" : "no discarded");
  return parts.join(" · ");
}

export default async function StockAuditHistoryPage({
  searchParams,
}: {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const sp = (await searchParams) as Record<
    string,
    string | string[] | undefined
  >;

  const propertyId =
    typeof sp.propertyId === "string" ? sp.propertyId : undefined;
  const snapshotId =
    typeof sp.snapshotId === "string" ? sp.snapshotId : undefined;

  const [properties, rows, detail] = await Promise.all([
    prisma.property.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    listStockAuditSnapshots({ propertyId }),
    snapshotId ? getStockAuditSnapshotWithDelta(snapshotId) : null,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <History className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          Audit-to-audit quantity changes
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved weekly stock audits (IST Monday week key, same scope as when
          recorded). Open <strong>View</strong> on a row to compare that audit to
          the <strong>immediately previous</strong> one for the same property and
          vendor/discarded settings—per-item totals, deltas, and CSV export.
        </p>
      </div>

      <Card className="rounded-2xl border p-4">
        <div className="text-sm font-medium text-muted-foreground">
          Filter by property
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            asChild
            variant={!propertyId ? "secondary" : "outline"}
            size="sm"
            className="rounded-full"
          >
            <Link href={BASE}>All properties</Link>
          </Button>
          {properties.map((p) => (
            <Button
              key={p.id}
              asChild
              variant={propertyId === p.id ? "secondary" : "outline"}
              size="sm"
              className="rounded-full"
            >
              <Link href={`${BASE}?propertyId=${encodeURIComponent(p.id)}`}>
                {p.name}
              </Link>
            </Button>
          ))}
        </div>
      </Card>

      <Card className="rounded-2xl border p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">
          Snapshots ({rows.length})
        </div>
        <ScrollArea className="w-full">
          <div className="min-w-[720px] overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Property</th>
                  <th className="px-3 py-2 font-medium">Week (Mon IST)</th>
                  <th className="px-3 py-2 font-medium">Scope</th>
                  <th className="px-3 py-2 font-medium">Captured</th>
                  <th className="px-3 py-2 text-right font-medium">Lines</th>
                  <th className="px-3 py-2 text-right font-medium">Total pcs</th>
                  <th className="px-3 py-2 font-medium">By</th>
                  <th className="px-3 py-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      No snapshots yet. Record from Weekly stock audit (admin) or
                      run the cron job.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const active = r.id === snapshotId;
                    const href = `${BASE}?${new URLSearchParams({
                      ...(propertyId ? { propertyId } : {}),
                      snapshotId: r.id,
                    }).toString()}`;
                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "border-b last:border-0 hover:bg-muted/30",
                          active && "bg-violet-500/10"
                        )}
                      >
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {r.propertyName}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {fmtIstDate(r.weekStart)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[140px]">
                          {scopeLabel(r.includeVendor, r.includeDiscarded)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {fmtIstDateTime(r.capturedAt)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {r.lineCount}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {r.totalQty}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[160px]">
                          {r.createdByName || r.createdByEmail ? (
                            <span className="truncate block">
                              {r.createdByName ?? r.createdByEmail}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <span>System</span>
                              <Badge variant="outline" className="text-[10px]">
                                cron
                              </Badge>
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 rounded-full"
                          >
                            <Link href={href}>
                              View
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {detail ? (
        <>
          <Separator />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-base font-semibold">
                {detail.propertyName} · week of {fmtIstDate(detail.weekStart)}
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{scopeLabel(detail.includeVendor, detail.includeDiscarded)}</span>
                {detail.prevWeekStart ? (
                  <span>
                    vs prior audit week {fmtIstDate(detail.prevWeekStart)}
                  </span>
                ) : (
                  <span>No earlier snapshot for this scope (first baseline).</span>
                )}
              </div>
            </div>
            <StockAuditDeltaCsvButton snapshotId={detail.id} />
          </div>

          {detail.prevWeekStart ? (
            <div className="flex flex-wrap gap-3">
              <Card className="rounded-2xl border px-4 py-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Lines with any change
                </div>
                <div className="text-2xl font-semibold tabular-nums">
                  {detail.summary.changedLineCount}
                </div>
              </Card>
              <Card className="rounded-2xl border px-4 py-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Net change (all items, pcs)
                </div>
                <div
                  className={cn(
                    "text-2xl font-semibold tabular-nums",
                    (detail.summary.netPiecesDelta ?? 0) > 0 &&
                      "text-emerald-700 dark:text-emerald-400",
                    (detail.summary.netPiecesDelta ?? 0) < 0 && "text-destructive"
                  )}
                >
                  {detail.summary.netPiecesDelta !== null
                    ? detail.summary.netPiecesDelta > 0
                      ? `+${detail.summary.netPiecesDelta}`
                      : String(detail.summary.netPiecesDelta)
                    : "—"}
                </div>
              </Card>
            </div>
          ) : null}

          <Card className="rounded-2xl border p-0">
            <p className="border-b px-3 py-2 text-xs text-muted-foreground">
              Rows with the largest absolute change appear first; unchanged items
              are at the bottom.
            </p>
            <ScrollArea className="w-full">
              <div className="min-w-[640px] overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 font-medium">SKU</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Current audit
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Prior audit
                      </th>
                      <th className="px-3 py-2 text-right font-medium">Δ qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((l) => (
                      <tr key={l.linenItemId} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{l.linenItemName}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {l.sku ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {l.totalQty}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                          {l.prevTotalQty !== null ? l.prevTotalQty : "—"}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-mono tabular-nums font-medium",
                            l.delta === null && "text-muted-foreground",
                            l.delta !== null &&
                              l.delta > 0 &&
                              "text-emerald-700 dark:text-emerald-400",
                            l.delta !== null &&
                              l.delta < 0 &&
                              "text-destructive"
                          )}
                        >
                          {l.delta !== null
                            ? l.delta > 0
                              ? `+${l.delta}`
                              : String(l.delta)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </Card>
        </>
      ) : null}
    </div>
  );
}
