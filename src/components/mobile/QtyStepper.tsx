"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Thumb-first quantity stepper.
 * - Press-and-hold repeats (accelerates after a moment).
 * - Tap the number to type it on the numeric keypad.
 * - Direction-aware number animation, pure CSS (no motion library).
 */
export function QtyStepper(props: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  /** Accessible name for the quantity, e.g. "Bedsheet quantity". */
  label?: string;
}) {
  const { value, onChange } = props;
  const min = props.min ?? 0;
  const max = props.max ?? 999999;
  const step = props.step ?? 1;

  const canDec = !(props.disabled || value <= min);
  const canInc = !(props.disabled || value >= max);

  // Latest value in a ref so hold-repeat doesn't capture stale state.
  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const bump = React.useCallback(
    (delta: number) => onChange(clamp(valueRef.current + delta, min, max)),
    [onChange, min, max]
  );

  // Press-and-hold with gentle acceleration.
  const holdTimer = React.useRef<number | null>(null);
  const holdTicks = React.useRef(0);

  const stopHold = React.useCallback(() => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    holdTicks.current = 0;
  }, []);

  const startHold = (delta: number) => {
    bump(delta);
    holdTicks.current = 0;
    const tick = () => {
      holdTicks.current += 1;
      bump(holdTicks.current > 12 ? delta * 5 : delta);
      holdTimer.current = window.setTimeout(
        tick,
        holdTicks.current > 12 ? 80 : 110
      );
    };
    holdTimer.current = window.setTimeout(tick, 400);
  };

  React.useEffect(() => stopHold, [stopHold]);

  // Direction for the number animation (render-phase state adjustment —
  // dir persists until the next change; the span is keyed by value so the
  // animation replays on every change).
  const [anim, setAnim] = React.useState<{ v: number; dir: -1 | 0 | 1 }>({
    v: value,
    dir: 0,
  });
  if (anim.v !== value) {
    setAnim({ v: value, dir: value > anim.v ? 1 : -1 });
  }
  const dir = anim.dir;

  // Tap-to-type
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commitDraft = () => {
    setEditing(false);
    if (draft.trim() === "") return;
    const n = Number.parseInt(draft, 10);
    if (Number.isFinite(n)) onChange(clamp(n, min, max));
  };

  const btn = cn(
    "press grid size-12 shrink-0 place-items-center rounded-xl",
    "disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl bg-muted p-1",
        props.className
      )}
    >
      <button
        type="button"
        className={cn(btn, "bg-card text-foreground shadow-xs")}
        disabled={!canDec}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") e.preventDefault();
          startHold(-step);
        }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onPointerLeave={stopHold}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={`Decrease ${props.label ?? "quantity"}`}
      >
        <Minus className="size-5" />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          autoFocus
          value={draft}
          min={min}
          max={max}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitDraft();
            if (e.key === "Escape") setEditing(false);
          }}
          className={cn(
            "h-12 w-16 rounded-xl border-0 bg-card text-center text-lg font-bold tabular-nums shadow-xs",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          )}
          aria-label={props.label ?? "Quantity"}
        />
      ) : (
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          className={cn(
            "grid h-12 w-16 place-items-center overflow-hidden rounded-xl",
            value > 0 ? "bg-card shadow-xs" : "bg-transparent",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          )}
          aria-label={`${props.label ?? "Quantity"}: ${value}. Tap to type.`}
        >
          <span
            key={value}
            data-numeric
            className={cn(
              "text-lg font-bold tabular-nums",
              value > 0 ? "text-foreground" : "text-muted-foreground",
              dir === 1 && "animate-num-up",
              dir === -1 && "animate-num-down"
            )}
          >
            {value}
          </span>
        </button>
      )}

      <button
        type="button"
        className={cn(btn, "bg-primary text-primary-foreground shadow-xs")}
        disabled={!canInc}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") e.preventDefault();
          startHold(step);
        }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onPointerLeave={stopHold}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={`Increase ${props.label ?? "quantity"}`}
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}
