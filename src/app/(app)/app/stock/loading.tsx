// src/app/app/stock/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

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
        {/* Headline card: total + the two states */}
        <div className="surface rounded-2xl p-4">
          <div className="flex items-baseline justify-between gap-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Skeleton className="h-[76px] rounded-xl" />
            <Skeleton className="h-[76px] rounded-xl" />
          </div>
        </div>

        {/* Item list */}
        <div className="surface rounded-2xl p-4">
          <Skeleton className="h-5 w-24 rounded-full" />
          <ul className="mt-3 divide-y divide-border border-t">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-40 rounded-full" />
                  <Skeleton className="mt-2 h-3 w-32 rounded-full" />
                </div>
                <Skeleton className="h-5 w-10 rounded-full" />
              </li>
            ))}
          </ul>
        </div>

        {/* Related job rows */}
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
