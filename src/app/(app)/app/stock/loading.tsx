// src/app/app/stock/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function BalanceRowSkeleton() {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="mt-2 h-3 w-24 rounded-full" />
      </div>
      <Skeleton className="h-5 w-10 rounded-full" />
    </li>
  );
}

export default function Loading() {
  return (
    <div className="min-h-dvh bg-background pb-6">
      <div className="sticky top-0 z-(--z-header) border-b bg-background">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="mt-1.5 h-3 w-36 rounded-full" />
          </div>
        </div>
      </div>

      <main
        className="mx-auto w-full max-w-md space-y-4 px-4 pt-4"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {/* Bucket chips skeleton */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-28 shrink-0 rounded-full" />
          ))}
        </div>

        {/* Headline card skeleton */}
        <div className="surface rounded-2xl p-4">
          <div className="flex items-baseline justify-between gap-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
          <ul className="mt-3 divide-y divide-border border-t">
            {Array.from({ length: 5 }).map((_, i) => (
              <BalanceRowSkeleton key={i} />
            ))}
          </ul>
        </div>

        {/* Related job rows skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
