"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sticky page header. `subtitle` is a plain-language one-liner that tells
 * staff exactly what this screen is for — keep it under ~8 words.
 */
export function PageHeader(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
  back?: boolean;
}) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-(--z-header) border-b bg-background",
        props.className
      )}
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
        {props.back !== false && (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="press -ml-2 grid size-11 shrink-0 place-items-center rounded-xl text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold leading-tight tracking-tight">
            {props.title}
          </h1>
          {props.subtitle ? (
            <p className="truncate text-sm text-muted-foreground">
              {props.subtitle}
            </p>
          ) : null}
        </div>

        {props.right ? (
          <div className="flex shrink-0 items-center">{props.right}</div>
        ) : null}
      </div>
    </header>
  );
}
