import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";

export default function Loading() {
  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      <div className="mx-auto w-full max-w-md px-4 pt-4 pb-24 space-y-4">
        <GlassCard className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-9 w-40 rounded-xl" />
          </div>
        </GlassCard>

        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[94px] rounded-2xl" />
            <Skeleton className="h-[94px] rounded-2xl" />
            <Skeleton className="h-[94px] rounded-2xl" />
            <Skeleton className="h-[94px] rounded-2xl" />
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <GlassCard className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </div>
          </GlassCard>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[86px] rounded-2xl" />
            <Skeleton className="h-[86px] rounded-2xl" />
            <Skeleton className="h-[86px] rounded-2xl" />
            <Skeleton className="h-[86px] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
