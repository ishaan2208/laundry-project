import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 pt-4 pb-24">
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="size-11 rounded-full" />
      </div>

      <Skeleton className="h-[88px] w-full rounded-2xl" />
      <Skeleton className="h-[88px] w-full rounded-2xl" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}
