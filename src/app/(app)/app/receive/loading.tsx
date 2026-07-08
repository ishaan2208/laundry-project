// src/app/app/receive/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function PickerSkeleton() {
  return (
    <div className="surface flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="mt-2 h-5 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

function LineCardSkeleton() {
  return (
    <div className="surface rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-2/3 rounded-full" />
          <Skeleton className="mt-2 h-3 w-32 rounded-full" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-dvh bg-background pb-28">
      <div className="sticky top-0 z-(--z-header) border-b bg-background">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="mt-1.5 h-3 w-40 rounded-full" />
          </div>
        </div>
      </div>

      <main
        className="mx-auto w-full max-w-md space-y-4 px-4 pt-4"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="space-y-3">
          <PickerSkeleton />
          <PickerSkeleton />
        </div>

        <Skeleton className="h-20 w-full rounded-2xl" />

        <div className="space-y-3">
          <LineCardSkeleton />
          <LineCardSkeleton />
          <LineCardSkeleton />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-(--z-sticky) border-t bg-card px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="mx-auto w-full max-w-md">
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
