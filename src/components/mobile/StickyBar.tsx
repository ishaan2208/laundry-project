"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Fixed bottom action bar for flow screens (the tab bar hides on those routes). */
export function StickyBar(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-(--z-sticky) border-t bg-background",
        props.className
      )}
    >
      <div className="mx-auto w-full max-w-md px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {props.children}
      </div>
    </div>
  );
}
