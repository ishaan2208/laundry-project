// src/app/app/txns/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function EntrySkeleton() {
  return (
    <div className="surface flex items-center justify-between gap-3 rounded-2xl p-4">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="mt-2 h-3 w-28 rounded-full" />
      </div>
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-dvh bg-background pb-8">
      <div className="sticky top-0 z-(--z-header) border-b bg-background">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="mt-1.5 h-3 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <main
        className="mx-auto w-full max-w-md space-y-4 px-4 pt-4"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="mt-2 h-3 w-24 rounded-full" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <EntrySkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
