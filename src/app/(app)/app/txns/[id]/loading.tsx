// src/app/app/txns/[id]/loading.tsx
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CalendarClock,
  Building2,
  Truck,
  Tag,
  NotebookText,
  ShieldAlert,
} from "lucide-react";

function BadgeSkeleton({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-violet-200/60 bg-white/60 px-3 py-2 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <span className="mr-2 inline-flex items-center text-violet-700 dark:text-violet-200">
        {icon}
      </span>
      <Skeleton className="h-3 w-24 rounded-full" />
    </div>
  );
}

function EntrySkeleton() {
  return (
    <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-48 rounded-full" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Skeleton className="h-3 w-40 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>

        <div className="text-right">
          <Skeleton className="ml-auto h-6 w-14 rounded-full" />
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
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex h-12 items-center rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <ArrowLeft className="mr-2 h-5 w-5 opacity-70" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>

          {/* Share button skeleton footprint */}
          <div className="inline-flex h-12 items-center rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
        </div>

        {/* Header card */}
        <Card className="mt-3 rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                    <Tag className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <Skeleton className="h-5 w-44 rounded-full" />
                    <Skeleton className="mt-2 h-3 w-28 rounded-full" />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <BadgeSkeleton icon={<Building2 className="h-4 w-4" />} />
                  <BadgeSkeleton icon={<Truck className="h-4 w-4" />} />
                  <BadgeSkeleton icon={<CalendarClock className="h-4 w-4" />} />
                  <div className="inline-flex items-center rounded-2xl border border-violet-200/60 bg-white/60 px-3 py-2 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                    <Skeleton className="h-3 w-16 rounded-full" />
                  </div>
                </div>

                {/* Reversal button skeleton */}
                <div className="mt-3">
                  <div className="inline-flex h-12 items-center rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                    <Skeleton className="h-4 w-28 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Void button skeleton */}
              <div className="flex items-center gap-2">
                <div className="inline-flex h-12 items-center rounded-2xl border border-violet-200/60 bg-white/60 px-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Note skeleton */}
        <Card className="mt-3 rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <NotebookText className="h-4 w-4" />
            <Skeleton className="h-3 w-10 rounded-full" />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-11/12 rounded-full" />
            <Skeleton className="h-3 w-9/12 rounded-full" />
          </div>
        </Card>

        {/* Voided info skeleton (kept subtle; sometimes it won't exist, but ok for loading) */}
        <Card className="mt-3 rounded-3xl border border-violet-200/60 bg-white/60 p-4 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-2xl bg-destructive/10 px-3 py-1.5 text-xs">
              <ShieldAlert className="mr-2 h-4 w-4 opacity-70" />
              <Skeleton className="h-3 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32 rounded-full" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-3 w-14 rounded-full" />
            <Skeleton className="h-3 w-48 rounded-full" />
          </div>
        </Card>

        <Separator className="my-5 opacity-60" />

        {/* Entries */}
        <div className="text-sm font-semibold">Entries</div>
        <div className="mt-2 grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <EntrySkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
