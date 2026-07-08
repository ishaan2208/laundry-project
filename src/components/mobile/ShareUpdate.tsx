"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, ClipboardCopy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * One-tap sharing of a laundry update: opens WhatsApp with the message
 * pre-filled (staff just pick the person/group), with copy as fallback
 * for any other app. Disabled until the text is ready.
 */
export function ShareUpdate({
  text,
  compact = false,
  className,
}: {
  text: string | null;
  compact?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    toast.success("Message copied — paste it anywhere.");
    window.setTimeout(() => setCopied(false), 1500);
  }

  const waHref = text
    ? `https://wa.me/?text=${encodeURIComponent(text)}`
    : undefined;

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        <Button asChild={!!waHref} variant="secondary" size="sm" disabled={!text}>
          {waHref ? (
            <a href={waHref} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4 text-clean" />
              WhatsApp
            </a>
          ) : (
            <span>
              <MessageCircle className="size-4" />
              WhatsApp
            </span>
          )}
        </Button>
        <Button variant="secondary" size="sm" disabled={!text} onClick={copy}>
          {copied ? (
            <Check className="size-4 text-clean" />
          ) : (
            <ClipboardCopy className="size-4" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      <Button
        asChild={!!waHref}
        size="xl"
        disabled={!text}
        className="w-full bg-clean text-primary-foreground hover:bg-clean/90"
      >
        {waHref ? (
          <a href={waHref} target="_blank" rel="noreferrer">
            <MessageCircle className="size-5" />
            WhatsApp par bhejo
          </a>
        ) : (
          <span>
            <MessageCircle className="size-5" />
            WhatsApp par bhejo
          </span>
        )}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={!text}
        onClick={copy}
      >
        {copied ? (
          <>
            <Check className="size-5 text-clean" />
            Copied
          </>
        ) : (
          <>
            <ClipboardCopy className="size-5" />
            Copy message
          </>
        )}
      </Button>
    </div>
  );
}
