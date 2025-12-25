import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      {/* premium, lightweight background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500/18 to-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/12 to-violet-500/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(124,58,237,0.10),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(232,121,249,0.08),transparent_35%)] dark:bg-[radial-gradient(circle_at_10%_0%,rgba(124,58,237,0.16),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(232,121,249,0.14),transparent_40%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-md px-4 pt-4 pb-24 space-y-5">
        {/* Header skeleton */}
        <GlassCard className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/25 to-fuchsia-600/15 ring-1 ring-white/15 dark:ring-white/10">
                  <Sparkles className="h-5 w-5 text-violet-200/80" />
                </div>
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-4 w-56" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-10 w-28 rounded-2xl" />
              <Skeleton className="h-9 w-20 rounded-2xl" />
            </div>
          </div>
        </GlassCard>

        {/* Quick actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="grid grid-cols-2 gap-3 auto-rows-fr">
            <GlassCard className="p-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-24" />
              <Skeleton className="mt-2 h-3 w-28" />
            </GlassCard>

            <GlassCard className="p-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-24" />
              <Skeleton className="mt-2 h-3 w-28" />
            </GlassCard>

            <GlassCard className="p-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-24" />
              <Skeleton className="mt-2 h-3 w-28" />
            </GlassCard>

            <GlassCard className="p-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-24" />
              <Skeleton className="mt-2 h-3 w-28" />
            </GlassCard>
          </div>
        </div>

        {/* Pending */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Today tiles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-3 w-20" />
              <Skeleton className="mt-2 h-7 w-14" />
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-3 w-20" />
              <Skeleton className="mt-2 h-7 w-14" />
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-3 w-20" />
              <Skeleton className="mt-2 h-7 w-14" />
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-3 w-20" />
              <Skeleton className="mt-2 h-7 w-14" />
            </GlassCard>
          </div>
        </div>

        {/* small bottom hint */}
        <div className="pt-1">
          <div className="rounded-2xl border border-white/15 bg-white/40 px-3 py-2 text-xs text-muted-foreground backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            Syncing today totals, pending, and recent activity…
          </div>
        </div>
      </div>
    </div>
  );
}
