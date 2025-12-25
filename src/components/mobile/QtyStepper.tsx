"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
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

  const reduceMotion = useReducedMotion();

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

  const canDec = !(props.disabled || value <= min);
  const canInc = !(props.disabled || value >= max);

  const baseBtn = cn(
    "h-12 w-12 rounded-2xl",
    "border border-violet-200/60 bg-white/60 backdrop-blur-[2px] shadow-sm",
    "dark:border-violet-500/15 dark:bg-zinc-950/40",
    "hover:bg-violet-600/10 dark:hover:bg-violet-500/10",
    "active:scale-[0.98] transition-[transform,background-color] duration-150"
  );

  const iconBase = "h-5 w-5";
  const plusColor = cn(
    "text-violet-700 dark:text-violet-200",
    !canInc && "text-muted-foreground/60 dark:text-muted-foreground/50"
  );
  const minusColor = cn(
    "text-rose-700 dark:text-rose-200",
    !canDec && "text-muted-foreground/60 dark:text-muted-foreground/50"
  );

  return (
    <LazyMotion features={domAnimation}>
      <div className={cn("flex items-center gap-2", props.className)}>
        <Button
          type="button"
          variant="secondary"
          className={baseBtn}
          disabled={!canDec}
          onPointerDown={() => startHold(-step)}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
          onClick={(e) => e.preventDefault()}
          aria-label="Decrease"
        >
          <Minus className={cn(iconBase, minusColor)} />
        </Button>

        <m.div
          key={String(value)}
          initial={reduceMotion ? false : { opacity: 0, y: 3, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.16, ease: "easeOut" }}
          className={cn(
            "min-w-[68px] rounded-2xl px-3 py-2 text-center text-base font-semibold tabular-nums",
            "border border-violet-200/70 bg-white/60 backdrop-blur-[2px]",
            "dark:border-violet-500/15 dark:bg-zinc-950/40"
          )}
          aria-label="Quantity"
        >
          {value}
        </m.div>

        <Button
          type="button"
          variant="secondary"
          className={baseBtn}
          disabled={!canInc}
          onPointerDown={() => startHold(step)}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
          onClick={(e) => e.preventDefault()}
          aria-label="Increase"
        >
          <Plus className={cn(iconBase, plusColor)} />
        </Button>
      </div>
    </LazyMotion>
  );
}
