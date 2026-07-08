"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Full-screen confirmation staff can trust without reading:
 * a drawn green check, one big sentence, and what happens next.
 */
export function SuccessScreen(props: {
  title: string;
  /** Human-readable summary, e.g. "34 pieces sent to CleanCo". */
  summary?: string;
  detail?: string;
  primaryLabel: string;
  onPrimary?: () => void;
  primaryHref?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="animate-pop grid size-24 place-items-center rounded-full bg-clean-soft">
          <svg
            viewBox="0 0 32 32"
            className="size-12 text-clean"
            fill="none"
            aria-hidden
          >
            <path
              d="M7 17l6 6 12-13"
              stroke="currentColor"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="check-draw"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          {props.title}
        </h1>
        {props.summary ? (
          <p className="mt-2 text-lg font-semibold text-foreground">
            {props.summary}
          </p>
        ) : null}
        {props.detail ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{props.detail}</p>
        ) : null}

        {props.children}
      </div>

      <div className="space-y-2.5 pt-4">
        {props.primaryHref ? (
          <Button asChild size="xl" className="w-full">
            <Link href={props.primaryHref}>{props.primaryLabel}</Link>
          </Button>
        ) : (
          <Button size="xl" className="w-full" onClick={props.onPrimary}>
            {props.primaryLabel}
          </Button>
        )}
        {props.secondaryLabel ? (
          <Button
            variant="secondary"
            size="xl"
            className="w-full"
            onClick={props.onSecondary}
          >
            {props.secondaryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
