"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function InlineField(props: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("space-y-2", props.className)}>
      <div className="px-1">
        <div className="text-xs font-semibold text-muted-foreground">
          {props.label}
        </div>
        {props.hint ? (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {props.hint}
          </div>
        ) : null}
      </div>
      {props.children}
    </div>
  );
}
