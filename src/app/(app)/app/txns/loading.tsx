// src/app/app/txns/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function TxnListItemSkeleton() {
  return (
    <div className="surface flex items-center gap-3 rounded-2xl px-3.5 py-3">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="mt-2 h-3 w-24 rounded-full" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-dvh bg-background pb-6">
      <div className="sticky top-0 z-(--z-header) border-b bg-background">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="mt-1.5 h-3 w-32 rounded-full" />
          </div>
          <Skeleton className="h-11 w-24 shrink-0 rounded-2xl" />
        </div>
      </div>

      <main
        className="mx-auto w-full max-w-md space-y-4 px-4 pt-4"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {/* Quick view chips skeleton */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-20 shrink-0 rounded-full" />
          ))}
        </div>

        {/* Day group skeleton */}
        <div className="space-y-5">
          <div>
            <Skeleton className="mb-2 h-4 w-28 rounded-full" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <TxnListItemSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
