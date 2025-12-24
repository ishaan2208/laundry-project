"use client";

import * as React from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ClipboardList,
  Truck,
  RotateCcw,
  Store,
  Ban,
  SunMoon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fadeUp, fade } from "@/components/motion/variants";

function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-white/15 bg-white/55 backdrop-blur-md dark:border-white/10 dark:bg-white/5",
        "shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_12px_40px_rgba(0,0,0,0.10)] dark:shadow-[0_1px_0_rgba(255,255,255,0.10)_inset,0_18px_60px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      {/* subtle highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent dark:from-white/10" />
      {children}
    </Card>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {title}
        </p>
        <p className="mt-0.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {desc}
        </p>
      </div>
    </div>
  );
}

function QuickActionTile({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/40 p-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 ring-1 ring-white/15 dark:ring-white/10">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          {label}
        </div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">{hint}</div>
      </div>
    </div>
  );
}

export default function ZenLanding() {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen overflow-hidden bg-zinc-50 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
        {/* Lightweight premium backdrop (static, no animated blur) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500/25 to-fuchsia-500/25 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.10),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(232,121,249,0.10),transparent_35%)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.18),transparent_45%),radial-gradient(circle_at_90%_20%,rgba(232,121,249,0.18),transparent_40%)]" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 pt-6 sm:px-6">
          {/* Top bar */}
          <m.header
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">
                  Zenvana
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  Laundry Ledger
                </div>
              </div>
            </div>

            <Badge
              variant="secondary"
              className="gap-1.5 border border-white/15 bg-white/50 text-zinc-700 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
            >
              <SunMoon className="h-3.5 w-3.5" aria-hidden="true" />
              Dark/Light ready
            </Badge>
          </m.header>

          {/* Hero */}
          <m.main
            variants={container}
            initial="hidden"
            animate="show"
            className="mt-7 flex flex-1 flex-col gap-4"
          >
            <m.div
              variants={fadeUp}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            >
              <GlassCard className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-violet-500/20 bg-violet-600/15 text-violet-700 dark:text-violet-200">
                      Audit-safe
                    </Badge>
                    <Badge className="border border-fuchsia-500/20 bg-fuchsia-600/15 text-fuchsia-700 dark:text-fuchsia-200">
                      Phone-first
                    </Badge>
                    <Badge className="border border-white/15 bg-white/50 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                      Admin + Housekeeping
                    </Badge>
                  </div>

                  <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                    Track linen like money.
                    <span className="block bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                      Every move is recorded.
                    </span>
                  </h1>

                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    Procurement, dispatch, receive, rewash, damage, discard —
                    all as ledger transactions. Clear balances by property,
                    location, item, and condition.
                  </p>

                  <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                    <Button
                      asChild
                      size="lg"
                      className={cn(
                        "h-12 w-full rounded-2xl text-base",
                        "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white",
                        "shadow-[0_10px_30px_rgba(124,58,237,0.25)]",
                        "hover:from-violet-500 hover:to-fuchsia-500",
                        "focus-visible:ring-2 focus-visible:ring-violet-400/60",
                        "active:scale-[0.99]"
                      )}
                    >
                      <Link href="/app" aria-label="Enter Zenvana Laundry App">
                        Enter app
                        <ArrowRight
                          className="ml-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="secondary"
                      size="lg"
                      className={cn(
                        "h-12 w-full rounded-2xl text-base",
                        "border border-white/15 bg-white/55 backdrop-blur-md",
                        "text-zinc-900 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
                      )}
                    >
                      <Link href="#how-it-works">How it works</Link>
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    No silent overwrites — reversals only.
                  </div>
                </div>
              </GlassCard>
            </m.div>

            {/* Quick actions preview */}
            <m.div
              variants={fadeUp}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              className="grid grid-cols-1 gap-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <QuickActionTile
                  icon={
                    <Truck
                      className="h-5 w-5 text-violet-200"
                      aria-hidden="true"
                    />
                  }
                  label="Dispatch to laundry"
                  hint="Soiled → Vendor"
                />
                <QuickActionTile
                  icon={
                    <RotateCcw
                      className="h-5 w-5 text-fuchsia-200"
                      aria-hidden="true"
                    />
                  }
                  label="Receive from laundry"
                  hint="Vendor → Clean / Damaged"
                />
                <QuickActionTile
                  icon={
                    <Store
                      className="h-5 w-5 text-violet-200"
                      aria-hidden="true"
                    />
                  }
                  label="Procurement"
                  hint="Add new clean stock"
                />
                <QuickActionTile
                  icon={
                    <Ban
                      className="h-5 w-5 text-fuchsia-200"
                      aria-hidden="true"
                    />
                  }
                  label="Discard / Lost"
                  hint="Damaged → Discarded"
                />
              </div>
            </m.div>

            {/* How it works */}
            <m.section
              id="how-it-works"
              variants={fadeUp}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              className="mt-2"
            >
              <GlassCard className="p-5">
                <div className="flex items-center gap-2">
                  <ClipboardList
                    className="h-5 w-5 text-violet-600 dark:text-violet-300"
                    aria-hidden="true"
                  />
                  <h2 className="text-base font-semibold tracking-tight">
                    What this app tracks
                  </h2>
                </div>

                <Separator className="my-3 bg-white/20 dark:bg-white/10" />

                <div className="space-y-4">
                  <FeatureRow
                    icon={
                      <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                    }
                    title="Complete audit trail"
                    desc="Every change is a transaction entry. Voids are reversals — nothing is deleted."
                  />
                  <FeatureRow
                    icon={
                      <Truck className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-300" />
                    }
                    title="Vendor pending visibility"
                    desc="Know what’s currently with each laundry vendor and how long it’s pending."
                  />
                  <FeatureRow
                    icon={
                      <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                    }
                    title="Fast on phones"
                    desc="Big tap targets, minimal typing, and clear status badges for staff."
                  />
                </div>
              </GlassCard>
            </m.section>

            {/* Footer */}
            <m.div
              variants={fade}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
              className="mt-4 flex items-center justify-center pb-2 text-xs text-zinc-500 dark:text-zinc-400"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/40 px-3 py-1 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                Zenvana Laundry Ledger • v1
              </span>
            </m.div>
          </m.main>
        </div>
      </div>
    </LazyMotion>
  );
}
