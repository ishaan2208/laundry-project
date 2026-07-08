import { Skeleton } from "@/components/ui/skeleton";

export default function StockAuditLoading() {
  return (
    <div className="min-h-dvh bg-background pb-8">
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pt-4" role="status" aria-busy="true" aria-live="polite">
        <div className="surface rounded-2xl p-4">
          <Skeleton className="h-5 w-40 rounded-full" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-3 w-full max-w-md rounded-full" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        </div>

        <div className="surface rounded-2xl p-4">
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
