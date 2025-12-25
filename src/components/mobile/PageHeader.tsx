"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader(props: {
  title: string;
  right?: React.ReactNode;
  className?: string;
  back?: boolean;
}) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "sticky top-0 z-20",
        "border-b border-violet-200/60 bg-background/80 backdrop-blur-[2px]",
        "dark:border-violet-500/15",
        props.className
      )}
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-2 px-3 py-3">
        {props.back !== false && (
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-2xl",
              "border border-violet-200/60 bg-white/60 backdrop-blur-[2px] shadow-sm",
              "dark:border-violet-500/15 dark:bg-zinc-950/40",
              "hover:bg-violet-600/10 dark:hover:bg-violet-500/10"
            )}
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold leading-tight">
            {props.title}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            Quick entry • thumb-first
          </div>
        </div>

        {props.right ? (
          <div className="flex items-center">{props.right}</div>
        ) : null}
      </div>
    </div>
  );
}
