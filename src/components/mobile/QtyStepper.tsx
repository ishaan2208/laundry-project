"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function QtyStepper(props: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}) {
  const { value, onChange } = props;

  const min = props.min ?? 0;
  const max = props.max ?? 999999;
  const step = props.step ?? 1;

  const bump = React.useCallback(
    (delta: number) => onChange(clamp((value ?? 0) + delta, min, max)),
    [value, onChange, min, max]
  );

  const holdRef = React.useRef<number | null>(null);

  const startHold = (delta: number) => {
    bump(delta);
    if (holdRef.current) window.clearInterval(holdRef.current);
    holdRef.current = window.setInterval(() => bump(delta), 120);
  };

  const stopHold = () => {
    if (holdRef.current) window.clearInterval(holdRef.current);
    holdRef.current = null;
  };

  React.useEffect(() => stopHold, []);

  const btnClass = cn(
    "h-12 w-12 rounded-2xl",
    "border border-violet-200/60 bg-white/60 backdrop-blur-[2px] shadow-sm",
    "dark:border-violet-500/15 dark:bg-zinc-950/40",
    "hover:bg-violet-600/10 dark:hover:bg-violet-500/10"
  );

  return (
    <div className={cn("flex items-center gap-2", props.className)}>
      <Button
        type="button"
        variant="secondary"
        className={btnClass}
        disabled={props.disabled || props.value <= min}
        onPointerDown={() => startHold(-step)}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onPointerLeave={stopHold}
        onClick={(e) => e.preventDefault()}
        aria-label="Decrease"
      >
        <Minus className="h-5 w-5" />
      </Button>

      <div
        className={cn(
          "min-w-[68px] rounded-2xl px-3 py-2 text-center text-base font-semibold",
          "border border-violet-200/70 bg-white/60 backdrop-blur-[2px]",
          "dark:border-violet-500/15 dark:bg-zinc-950/40"
        )}
        aria-label="Quantity"
      >
        {props.value}
      </div>

      <Button
        type="button"
        variant="secondary"
        className={btnClass}
        disabled={props.disabled || props.value >= max}
        onPointerDown={() => startHold(step)}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onPointerLeave={stopHold}
        onClick={(e) => e.preventDefault()}
        aria-label="Increase"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}
