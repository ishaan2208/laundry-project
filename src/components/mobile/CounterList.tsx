"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { QtyStepper } from "@/components/mobile/QtyStepper";

/** Grouped list container for counting rows. */
export function CounterList(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface divide-y divide-border overflow-hidden rounded-2xl",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

/**
 * One linen item + stepper. `meta` is the plain-language context line
 * ("24 with laundry", "In store: 112"). `extra` renders under the row
 * for secondary counters (damaged / rewash).
 */
export function CounterRow(props: {
  name: string;
  meta?: React.ReactNode;
  value: number;
  onChange: (next: number) => void;
  max?: number;
  disabled?: boolean;
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-3.5 py-3 transition-colors duration-200",
        props.value > 0 && "bg-accent/40",
        props.className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 py-1">
          <div className="truncate text-base font-semibold leading-snug">
            {props.name}
          </div>
          {props.meta ? (
            <div className="mt-0.5 truncate text-sm text-muted-foreground">
              {props.meta}
            </div>
          ) : null}
        </div>

        <QtyStepper
          value={props.value}
          onChange={props.onChange}
          max={props.max}
          disabled={props.disabled}
          label={`${props.name} quantity`}
        />
      </div>

      {props.extra}
    </div>
  );
}
