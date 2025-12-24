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
  const min = props.min ?? 0;
  const max = props.max ?? 999999;
  const step = props.step ?? 1;

  const bump = React.useCallback(
    (delta: number) =>
      props.onChange(clamp((props.value ?? 0) + delta, min, max)),
    [props, min, max]
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

  return (
    <div className={cn("flex items-center gap-2", props.className)}>
      <Button
        type="button"
        variant="secondary"
        className="h-11 w-11 rounded-2xl"
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

      <div className="min-w-[56px] rounded-2xl border px-3 py-2 text-center text-base font-semibold">
        {props.value}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="h-11 w-11 rounded-2xl"
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
