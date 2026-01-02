// src/app/app/stock/loading.tsx
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Boxes,
  TriangleAlert,
  Building2,
  PackageSearch,
  Sparkles,
  Warehouse,
  Shirt,
  Droplets,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

function ChipSkeleton({
  icon,
  w = "w-24",
}: {
  icon?: React.ReactNode;
  w?: string;
}) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-violet-200/60 bg-white/60 px-3 py-2 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      {icon ? (
        <span className="mr-2 inline-flex items-center text-violet-700 dark:text-violet-200">
          {icon}
        </span>
      ) : null}
      <Skeleton className={`h-3 ${w} rounded-full`} />
    </div>
  );
}

function BalanceRowSkeleton() {
  return (
    <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-52 rounded-full" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Skeleton className="h-3 w-40 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-full" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="ml-auto h-6 w-16 rounded-full" />
          <Skeleton className="mt-2 ml-auto h-3 w-10 rounded-full" />
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
        {/* Header Card */}
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    <Boxes className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      Stock Snapshot
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Loading balances…
                    </div>
                  </div>
                </div>

                {/* Chips skeleton (match footprints to avoid layout jump) */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <ChipSkeleton
                    icon={<Building2 className="h-4 w-4" />}
                    w="w-28"
                  />
                  <ChipSkeleton
                    icon={<Warehouse className="h-4 w-4" />}
                    w="w-24"
                  />
                  <ChipSkeleton w="w-20" />
                  <ChipSkeleton
                    icon={<PackageSearch className="h-4 w-4" />}
                    w="w-28"
                  />
                  <div className="inline-flex items-center rounded-2xl bg-destructive/10 px-3 py-1.5 text-xs">
                    <TriangleAlert className="mr-2 h-4 w-4 opacity-70" />
                    <Skeleton className="h-3 w-20 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Filters button skeleton footprint */}
              <div className="flex items-center gap-2">
                <div className="inline-flex h-11 items-center justify-center rounded-2xl border border-violet-200/60 bg-white/60 px-4 text-sm font-semibold backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                  <SlidersHorizontal className="mr-2 h-4 w-4 opacity-70" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
              </div>
            </div>

            {/* Property picker skeleton area (only shows in real UI if >1, but safe as placeholder) */}
            <div className="mt-4">
              <div className="rounded-2xl border border-violet-200/60 bg-white/50 p-3 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/30">
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>

            {/* Reset tip row skeleton */}
            <>
              <Separator className="my-4 opacity-60" />
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-56 rounded-full" />
                <div className="inline-flex h-11 items-center rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                  <RotateCcw className="mr-2 h-4 w-4 opacity-60" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
              </div>
            </>
          </div>
        </Card>

        {/* Body */}
        <div className="mt-3 space-y-2">
          {/* Table/list skeleton rows (BalanceTable replacement) */}
          {Array.from({ length: 8 }).map((_, i) => (
            <BalanceRowSkeleton key={i} />
          ))}

          {/* Optional empty-state hint skeleton (keeps page feeling alive) */}
          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="mt-2 h-3 w-72 rounded-full" />
                <Skeleton className="mt-2 h-3 w-56 rounded-full" />
              </div>
            </div>
          </Card>

          {/* Small “kind icon” vibe row (subtle, optional) */}
          <div className="mt-2 flex flex-wrap gap-2">
            <ChipSkeleton icon={<Shirt className="h-4 w-4" />} w="w-20" />
            <ChipSkeleton icon={<Droplets className="h-4 w-4" />} w="w-24" />
            <ChipSkeleton icon={<Warehouse className="h-4 w-4" />} w="w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
