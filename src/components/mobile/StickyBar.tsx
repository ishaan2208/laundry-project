"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function StickyBar(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur pb-20",
        props.className
      )}
    >
      <div className="mx-auto w-full max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
        {props.children}
      </div>
    </div>
  );
}
