import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck } from "lucide-react";

export default function StockAuditLoading() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-violet-50/60 to-background dark:from-violet-950/20">
      <div className="mx-auto w-full max-w-7xl p-3 pb-8">
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-48 rounded-full" />
              <Skeleton className="h-3 w-full max-w-md rounded-full" />
              <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className="h-8 w-28 rounded-2xl" />
                <Skeleton className="h-8 w-32 rounded-2xl" />
              </div>
            </div>
          </div>
        </Card>
        <Card className="mt-3 rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </Card>
      </div>
    </div>
  );
}
