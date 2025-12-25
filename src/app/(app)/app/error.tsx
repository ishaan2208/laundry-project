"use client";

import * as React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // keep this lightweight; you can later send to Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-4 pb-24">
      <GlassCard className="p-5">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 ring-1 ring-white/15 dark:ring-white/10">
            <AlertTriangle className="h-5 w-5 text-fuchsia-300" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold">Something went wrong</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Please retry. If it keeps happening, tell admin to check logs.
            </div>
            <Button
              onClick={reset}
              className="mt-4 w-full h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
