"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type LinenConditionUI = "CLEAN" | "SOILED" | "REWASH" | "DAMAGED";

const styles: Record<LinenConditionUI, string> = {
  CLEAN: "bg-clean-soft text-clean",
  SOILED: "bg-soiled-soft text-soiled",
  REWASH: "bg-rewash-soft text-rewash",
  DAMAGED: "bg-damaged-soft text-damaged",
};

const labels: Record<LinenConditionUI, string> = {
  CLEAN: "Clean",
  SOILED: "Soiled",
  REWASH: "Rewash",
  DAMAGED: "Damaged",
};

/** Condition chip. Always shows the word — staff never decode an icon. */
export function StatusPill(props: {
  condition: LinenConditionUI;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[props.condition],
        props.className
      )}
    >
      {props.children ?? labels[props.condition]}
    </span>
  );
}
