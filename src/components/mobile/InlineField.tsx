"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function InlineField(props: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", props.className)}>
      <div className="text-xs font-medium text-muted-foreground">
        {props.label}
      </div>
      {props.children}
    </div>
  );
}
