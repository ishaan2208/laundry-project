// src/app/app/dispatch/loading.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  AlertTriangle,
  PackagePlus,
  Trash2,
  CheckCircle2,
} from "lucide-react";

function SelectSkeleton({ icon }: { icon: React.ReactNode }) {
  return (
    <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="mt-2 h-5 w-2/3 rounded-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded-2xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function LineCardSkeleton() {
  return (
    <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-2/3 rounded-full" />
            <Skeleton className="mt-2 h-3 w-44 rounded-full" />
          </div>

          <div className="flex items-center gap-2">
            {/* QtyStepper footprint */}
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-10 w-14 rounded-2xl" />
            <Skeleton className="h-12 w-12 rounded-2xl" />

            {/* remove button footprint */}
            <div className="grid h-12 w-12 place-items-center rounded-2xl text-muted-foreground">
              <Trash2 className="h-5 w-5 opacity-40" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      {/* Header (matches PageHeader footprint) */}
      <div className="sticky top-0 z-20 border-b border-violet-200/40 bg-white/60 backdrop-blur-[6px] dark:border-violet-500/10 dark:bg-zinc-950/40">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-3 py-3">
          <div className="min-w-0">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="mt-2 h-3 w-44 rounded-full" />
          </div>

          <Badge
            variant="secondary"
            className="rounded-2xl border border-violet-200/60 bg-white/60 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
          >
            <Truck className="mr-1 h-4 w-4 opacity-70" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </Badge>
        </div>
      </div>

      <main
        className="mx-auto w-full max-w-md space-y-4 px-3 pb-28 pt-4"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {/* Pickers */}
        <div className="space-y-3">
          <SelectSkeleton icon={<AlertTriangle className="h-5 w-5" />} />
          <SelectSkeleton icon={<Truck className="h-5 w-5" />} />
        </div>

        {/* Status / Guidance card skeleton */}
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="mt-2 h-3 w-60 rounded-full" />
              </div>
              <div className="rounded-2xl bg-violet-600 px-3 py-2 text-xs text-white dark:bg-violet-500">
                <Skeleton className="h-3 w-16 rounded-full bg-white/50" />
              </div>
            </div>

            <Separator className="my-3 opacity-60" />

            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded-full" />
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-2xl border border-violet-200/60 bg-white/60 px-3 py-2 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                  <Skeleton className="h-3 w-28 rounded-full" />
                </div>
                <div className="inline-flex items-center rounded-2xl border border-violet-200/60 bg-white/60 px-3 py-2 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                  <Skeleton className="h-3 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* “Add Items” / empty-state feel skeleton */}
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-violet-600/10 p-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                <PackagePlus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="mt-2 h-3 w-64 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lines list skeleton */}
        <div className="space-y-3">
          <LineCardSkeleton />
          <LineCardSkeleton />
          <LineCardSkeleton />
        </div>
      </main>

      {/* Sticky bottom CTA skeleton (mimics StickyBar footprint) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-violet-200/40 bg-white/70 backdrop-blur-[10px] dark:border-violet-500/10 dark:bg-zinc-950/60">
        <div className="mx-auto w-full max-w-md px-3 pb-4 pt-3">
          <div className="flex items-center justify-between pb-2 text-sm">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>

          <div className="mb-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-2xl border border-violet-200/60 bg-white/60 px-3 py-2 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
                <Skeleton className="h-3 w-16 rounded-full" />
              </div>
              <div className="inline-flex items-center rounded-2xl bg-violet-600 px-3 py-2 text-white dark:bg-violet-500">
                <Skeleton className="h-3 w-16 rounded-full bg-white/50" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 opacity-60" />
              <Skeleton className="h-3 w-28 rounded-full" />
            </span>
          </div>

          <div className="flex h-14 w-full items-center justify-center rounded-2xl bg-violet-600 text-base font-semibold text-white dark:bg-violet-500">
            <CheckCircle2 className="mr-2 h-5 w-5 opacity-70" />
            <Skeleton className="h-4 w-40 rounded-full bg-white/45" />
          </div>
        </div>
      </div>
    </div>
  );
}
