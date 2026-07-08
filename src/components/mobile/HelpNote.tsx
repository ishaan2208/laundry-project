import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One always-visible plain-language sentence that tells staff what a screen
 * or section actually does. Not dismissible — the explanation IS the UI.
 */
export function HelpNote({
  children,
  tone = "info",
  className,
}: {
  children: React.ReactNode;
  tone?: "info" | "warn";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm leading-relaxed",
        tone === "warn"
          ? "bg-soiled-soft text-soiled"
          : "bg-accent/60 text-accent-foreground",
        className
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
