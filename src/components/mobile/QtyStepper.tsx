"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import {
  LazyMotion,
  domAnimation,
  m,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Dir = -1 | 0 | 1;

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

  const canDec = !(props.disabled || value <= min);
  const canInc = !(props.disabled || value >= max);

  const bump = React.useCallback(
    (delta: number) => onChange(clamp((value ?? 0) + delta, min, max)),
    [value, onChange, min, max]
  );

  // press-and-hold support (mobile)
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

  // direction-aware animations for qty
  const prevRef = React.useRef<number>(value);
  const [dir, setDir] = React.useState<Dir>(0);

  React.useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;

    const nextDir: Dir = value > prev ? 1 : -1;
    setDir(nextDir);
    prevRef.current = value;

    const t = window.setTimeout(() => setDir(0), 220);
    return () => window.clearTimeout(t);
  }, [value]);

  // shared classes
  const shell = cn(
    "inline-flex items-center gap-1 rounded-2xl p-2",
    "bg-slate-500/5 dark:bg-gray-100/5",
    "backdrop-blur-[2px]"
  );

  const btnBase = cn(
    "h-11 w-11 rounded-2xl",
    "shadow-sm shadow-black/5 dark:shadow-black/30",
    "transition-colors duration-150",
    "active:scale-[0.98]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // kill shadcn focus ring
    "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
  );

  const plusBtn = cn(
    "bg-emerald-500/10 hover:bg-emerald-500/15",
    "text-emerald-800 dark:text-emerald-300",
    "dark:bg-emerald-400/10 dark:hover:bg-emerald-400/15"
  );

  const minusBtn = cn(
    "bg-rose-500/10 hover:bg-rose-500/15",
    "text-rose-800 dark:text-rose-300",
    "dark:bg-rose-400/10 dark:hover:bg-rose-400/15"
  );

  const qtyPill = cn(
    "relative isolate",
    "min-w-[56px] h-11 px-3",
    "rounded-2xl",
    "grid place-items-center",
    "bg-white/70 dark:bg-zinc-950/35",
    "shadow-sm shadow-black/5 dark:shadow-black/30",
    // no border / no ring (as requested)
    "border-0 ring-0 outline-none"
  );

  const iconCls = "h-5 w-5";

  const qtyTextBase = cn(
    "tabular-nums",
    "text-[15px] sm:text-base",
    "font-semibold tracking-tight",
    "text-zinc-900 dark:text-zinc-50"
  );

  // flash overlay color (brief feedback)
  const flashBg =
    dir === 1
      ? "bg-emerald-500/16 dark:bg-emerald-400/14"
      : dir === -1
      ? "bg-rose-500/16 dark:bg-rose-400/14"
      : "bg-transparent";

  return (
    <LazyMotion features={domAnimation}>
      <div className={cn(shell, props.className)}>
        <Button
          asChild
          type="button"
          variant="ghost"
          size="icon"
          className={cn(btnBase, minusBtn)}
          disabled={!canDec}
          onPointerDown={(e) => {
            e.preventDefault();
            startHold(-step);
          }}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
          onClick={(e) => e.preventDefault()}
          aria-label="Decrease"
        >
          <m.button
            type="button"
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            transition={{ duration: 0.12 }}
          >
            <Minus className={iconCls} />
          </m.button>
        </Button>

        <div className={qtyPill} aria-label="Quantity">
          {/* soft flash feedback behind number */}
          <AnimatePresence mode="popLayout" initial={false}>
            {dir !== 0 ? (
              <m.div
                key={`flash-${value}`}
                className={cn(
                  "pointer-events-none absolute inset-0 -z-10 rounded-lg",
                  flashBg
                )}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: [0, 1, 0],
                        scale: [0.985, 1, 1.03],
                      }
                }
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              />
            ) : null}
          </AnimatePresence>

          {/* direction-aware number animation */}
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={String(value)}
              className={cn(
                qtyTextBase,
                dir === 1 && "text-emerald-900 dark:text-emerald-200",
                dir === -1 && "text-rose-900 dark:text-rose-200"
              )}
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: dir === 1 ? 7 : dir === -1 ? -7 : 0,
                      scale: 0.985,
                    }
              }
              animate={
                reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                reduceMotion
                  ? undefined
                  : {
                      opacity: 0,
                      y: dir === 1 ? -7 : dir === -1 ? 7 : 0,
                      scale: 0.985,
                    }
              }
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {value}
            </m.span>
          </AnimatePresence>
        </div>

        <Button
          asChild
          type="button"
          variant="ghost"
          size="icon"
          className={cn(btnBase, plusBtn)}
          disabled={!canInc}
          onPointerDown={(e) => {
            e.preventDefault();
            startHold(step);
          }}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
          onClick={(e) => e.preventDefault()}
          aria-label="Increase"
        >
          <m.button
            type="button"
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            transition={{ duration: 0.12 }}
          >
            <Plus className={iconCls} />
          </m.button>
        </Button>
      </div>
    </LazyMotion>
  );
}
