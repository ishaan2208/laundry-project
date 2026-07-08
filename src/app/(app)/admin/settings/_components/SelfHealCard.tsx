"use client";

import * as React from "react";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { runMastersSelfHeal } from "@/actions/masters/runMastersSelfHeal";

export default function SelfHealCard() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  function run() {
    startTransition(async () => {
      await runMastersSelfHeal();
      setDone(true);
      window.setTimeout(() => setDone(false), 1500);
      router.refresh();
    });
  }

  return (
    <div className="surface rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Wrench className="size-5" />
            </span>
            <div>
              <div className="text-sm font-semibold">Self-heal defaults</div>
              <div className="text-sm text-muted-foreground">
                Recreate missing default locations &amp; vendor locations.
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3.5" />
              Safe operation
            </Badge>
            <Badge variant="outline" className="gap-1">
              <ShieldAlert className="size-3.5" />
              Use after migrations
            </Badge>
          </div>
        </div>

        <Button disabled={pending} onClick={run} size="lg">
          {done ? (
            <>
              <CheckCircle2 className="size-4" />
              Done
            </>
          ) : (
            <>
              <Wrench className="size-4" />
              Run
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
        If something looks missing (vendor pending, stock,
        dispatch/receive), run this once. It won&rsquo;t delete anything.
      </div>
    </div>
  );
}
