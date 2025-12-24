"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LinenConditionUI = "CLEAN" | "SOILED" | "REWASH" | "DAMAGED";

export function StatusPill(props: {
  condition: LinenConditionUI;
  className?: string;
}) {
  const v =
    props.condition === "CLEAN"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
      : props.condition === "SOILED"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
      : props.condition === "REWASH"
      ? "bg-sky-500/15 text-sky-300 border-sky-500/25"
      : "bg-rose-500/15 text-rose-300 border-rose-500/25";

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px]",
        v,
        props.className
      )}
    >
      {props.condition}
    </Badge>
  );
}
