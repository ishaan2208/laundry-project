import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Card>
>(({ className, ...props }, ref) => {
  return (
    <Card
      ref={ref as any}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "border-white/15 bg-white/55 backdrop-blur-md",
        "dark:border-white/10 dark:bg-white/5",
        "shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_12px_40px_rgba(0,0,0,0.08)]",
        "dark:shadow-[0_1px_0_rgba(255,255,255,0.10)_inset,0_18px_60px_rgba(0,0,0,0.45)]",
        className
      )}
      {...props}
    >
      {/* soft highlight (static) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent dark:from-white/10" />
      <div className="relative">{props.children}</div>
    </Card>
  );
});
GlassCard.displayName = "GlassCard";
