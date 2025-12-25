"use client";

import * as React from "react";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { Wrench, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { runMastersSelfHeal } from "@/actions/masters/runMastersSelfHeal";

export default function SelfHealCard() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  function run() {
    startTransition(async () => {
      await runMastersSelfHeal();
      setDone(true);
      window.setTimeout(() => setDone(false), 1500);
      router.refresh();
    });
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
      >
        <Card className="rounded-3xl border bg-background/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-background/50">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      Self-heal defaults
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Recreate missing default locations & vendor locations.
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1 rounded-full">
                    <Sparkles className="h-3.5 w-3.5" />
                    Safe operation
                  </Badge>
                  <Badge variant="outline" className="gap-1 rounded-full">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Use after migrations
                  </Badge>
                </div>
              </div>

              <Button
                disabled={pending}
                onClick={run}
                className="h-11 rounded-2xl gap-2"
              >
                {done ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Done
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4" />
                    Run
                  </>
                )}
              </Button>
            </div>

            <div className="mt-3 rounded-2xl border bg-background/50 p-3 text-xs text-muted-foreground">
              If something looks missing (vendor pending, stock,
              dispatch/receive), run this once. It won’t delete anything.
            </div>
          </CardContent>
        </Card>
      </m.div>
    </LazyMotion>
  );
}
