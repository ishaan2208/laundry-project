"use client";

import Link from "next/link";
import { ChevronRight, Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

import type { VendorPendingTopRow } from "@/actions/reports/getTopVendorPending";

/** "With the laundry right now" — the number staff get asked about every day. */
export function PendingCard({
  propertyId,
  rows,
  isAdmin,
}: {
  propertyId?: string;
  rows: VendorPendingTopRow[] | null;
  isAdmin?: boolean;
}) {
  const href = propertyId
    ? `/app/vendors?propertyId=${encodeURIComponent(propertyId)}`
    : "/app/vendors";

  const total = rows?.reduce((s, r) => s + Math.max(r.pendingQty, 0), 0) ?? 0;
  const hasWrong = rows?.some((r) => r.pendingQty < 0) ?? false;
  const allClear = rows !== null && rows !== undefined && rows.length === 0;

  return (
    <section aria-label="With the laundry" className="surface rounded-2xl">
      <Link
        href={href}
        className="press-soft flex items-center justify-between gap-3 rounded-t-2xl px-4 pb-3 pt-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <div className="min-w-0">
          <h2 className="text-base font-bold">With the laundry</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sent for washing, not yet back
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {rows ? (
            <span
              data-numeric
              className={cn(
                "text-2xl font-bold tracking-tight",
                total > 0 ? "text-soiled" : "text-clean"
              )}
            >
              {total}
            </span>
          ) : (
            <span className="h-7 w-10 animate-pulse rounded bg-muted" />
          )}
          <ChevronRight className="size-5 text-muted-foreground" />
        </div>
      </Link>

      {allClear ? (
        <div className="flex items-center gap-2.5 border-t px-4 py-3.5">
          <span className="grid size-8 place-items-center rounded-full bg-clean-soft">
            <Check className="size-4.5 text-clean" />
          </span>
          <p className="text-sm font-medium">
            All clear — nothing is with the laundry.
          </p>
        </div>
      ) : rows ? (
        <>
          <ul className="divide-y divide-border border-t">
            {rows.map((r) => {
              const wrong = r.pendingQty < 0;
              return (
                <li
                  key={r.vendorId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-semibold">
                    {r.vendorName}
                  </span>
                  <span className="flex items-baseline gap-1">
                    <span
                      data-numeric
                      className={cn(
                        "text-base font-bold",
                        wrong && "text-damaged"
                      )}
                    >
                      {r.pendingQty}
                    </span>
                    <span className="text-xs text-muted-foreground">pcs</span>
                  </span>
                </li>
              );
            })}
          </ul>

          {hasWrong ? (
            <div className="flex items-start gap-2 border-t bg-damaged-soft px-4 py-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-damaged" />
              <p className="text-sm font-medium text-damaged">
                A minus number is impossible — some entries went wrong.{" "}
                {isAdmin
                  ? "Fix it with a Fresh start in Admin."
                  : "Tell your admin so they can fix it."}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="space-y-2 border-t px-4 py-3.5">
          <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
        </div>
      )}
    </section>
  );
}
