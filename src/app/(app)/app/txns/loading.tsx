// src/app/app/txns/loading.tsx
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, ListChecks, ArrowDown } from "lucide-react";

function PillSkeleton() {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-violet-200/60 bg-white/60 px-3 py-2 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-3 w-20 rounded-full" />
    </div>
  );
}

function TxnListItemSkeleton() {
  return (
    <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-44 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24 rounded-2xl" />
            <Skeleton className="h-6 w-28 rounded-2xl" />
            <Skeleton className="h-6 w-20 rounded-2xl" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <div
        className="mx-auto w-full max-w-2xl p-3 pb-8"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                <ListChecks className="h-5 w-5" />
              </span>

              <div>
                <div className="text-lg font-semibold leading-tight">
                  Transactions
                </div>
                <div className="text-xs text-muted-foreground">
                  Loading audit log…
                </div>
              </div>
            </div>
          </div>

          {/* Filters button skeleton (same footprint as your real button) */}
          <div className="h-10">
            <div className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-violet-200/60 bg-white/60 px-4 text-sm font-semibold backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
              <SlidersHorizontal className="h-4 w-4 opacity-70" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
          </div>
        </div>

        {/* Active pills skeleton */}
        <div className="mt-3 flex flex-wrap gap-2">
          <PillSkeleton />
          <PillSkeleton />
          <PillSkeleton />
        </div>

        {/* List skeleton */}
        <div className="mt-3 grid gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <TxnListItemSkeleton key={i} />
          ))}
        </div>

        {/* Load more skeleton */}
        <div className="mt-4">
          <div className="flex h-14 w-full items-center justify-center rounded-2xl border border-violet-200/60 bg-white/60 text-base font-semibold backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <ArrowDown className="mr-2 h-5 w-5 opacity-50" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
