"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react";

export type LinenConditionUI = "CLEAN" | "SOILED" | "REWASH" | "DAMAGED";

export function StatusPill(props: {
  condition: LinenConditionUI;
  className?: string;
}) {
  const v =
    props.condition === "CLEAN"
      ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
      : props.condition === "SOILED"
      ? "bg-amber-500/15 text-amber-500 border-amber-500/40"
      : props.condition === "REWASH"
      ? "bg-sky-500/15 text-sky-500 border-sky-500/40"
      : "bg-rose-500/15 text-rose-500 border-rose-500/40";

  const icon =
    props.condition === "CLEAN" ? (
      <CheckCircle className="h-4 w-4" />
    ) : props.condition === "SOILED" ? (
      <AlertTriangle className=" h-4 w-4" />
    ) : props.condition === "REWASH" ? (
      <RefreshCw className=" h-4 w-4" />
    ) : (
      <XCircle className=" h-4 w-4" />
    );

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2 py-2 text-[11px] flex items-center",
        v,
        props.className
      )}
    >
      {icon}
      {/* {props.condition} */}
    </Badge>
  );
}
