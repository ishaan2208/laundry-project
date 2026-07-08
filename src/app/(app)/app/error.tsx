"use client";

import * as React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-damaged-soft">
        <AlertTriangle className="size-8 text-damaged" />
      </span>
      <h1 className="mt-5 text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-xs text-base text-muted-foreground">
        Your work is safe. Try again — if it keeps happening, tell your
        manager.
      </p>
      <Button size="xl" className="mt-6 w-full" onClick={reset}>
        <RefreshCcw className="size-5" />
        Try again
      </Button>
    </div>
  );
}
