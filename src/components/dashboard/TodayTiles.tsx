"use client";

import type { DashboardSummary } from "@/actions/reports/getDashboardSummary";

/** Today's movement, one glance. Derived from the ledger, per property. */
export function TodayCard({ summary }: { summary: DashboardSummary | null }) {
  const stats = [
    { label: "Sent", value: summary?.dispatched },
    { label: "Received", value: summary?.received },
    { label: "New stock", value: summary?.procured },
    { label: "Removed", value: summary?.discarded },
  ];

  return (
    <section aria-label="Today" className="surface rounded-2xl p-4">
      <h2 className="text-base font-bold">Today</h2>
      <div className="mt-3 grid grid-cols-4 divide-x divide-border">
        {stats.map((s) => (
          <div key={s.label} className="px-1 text-center first:pl-0 last:pr-0">
            {summary ? (
              <div
                data-numeric
                className="text-2xl font-bold leading-none tracking-tight"
              >
                {s.value ?? 0}
              </div>
            ) : (
              <div className="mx-auto h-6 w-8 animate-pulse rounded bg-muted" />
            )}
            <div className="mt-1.5 text-xs font-medium text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
