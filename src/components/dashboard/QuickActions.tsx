// src/components/dashboard/QuickActions.tsx
"use client";

import Link from "next/link";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Download,
  ShoppingCart,
  Trash2,
  Settings,
  BarChart3,
  Zap,
  ChevronRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/components/motion/variants";

type Props = {
  propertyId?: string;
  isAdmin: boolean;
};

function ActionCard({
  href,
  title,
  subtitle,
  icon: Icon,
  badge,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: any;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-3xl focus:outline-none focus:ring-2 focus:ring-violet-500/40"
    >
      <GlassCard
        className={cn(
          "h-full p-4",
          "rounded-3xl border border-violet-200/60 bg-white/60 backdrop-blur-[2px]",
          "dark:border-violet-500/15 dark:bg-zinc-950/40",
          "active:scale-[0.99] transition-transform"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-2xl",
              "bg-violet-600/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
              "ring-1 ring-violet-200/60 dark:ring-violet-500/15"
            )}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex items-center gap-2">
            {badge ? (
              <Badge
                variant="secondary"
                className="h-7 rounded-full border border-violet-200/60 bg-white/60 px-2 text-[11px] backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
              >
                {badge}
              </Badge>
            ) : null}
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-sm font-semibold leading-tight">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </GlassCard>
    </Link>
  );
}

export function QuickActions({ propertyId, isAdmin }: Props) {
  const reduceMotion = useReducedMotion();
  const qp = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : "";

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: reduceMotion ? 0 : 0.06 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3 auto-rows-fr">
          <m.div
            variants={fadeUp}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <ActionCard
              href={`/app/dispatch${qp}`}
              title="Dispatch"
              subtitle="Soiled → Laundry"
              icon={ArrowUpRight}
              badge="Fast"
            />
          </m.div>

          <m.div
            variants={fadeUp}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <ActionCard
              href={`/app/receive${qp}`}
              title="Receive"
              subtitle="Laundry → Clean"
              icon={Download}
            />
          </m.div>

          {isAdmin ? (
            <>
              <m.div
                variants={fadeUp}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
              >
                <ActionCard
                  href={`/admin/procurement${qp}`}
                  title="Procurement"
                  subtitle="Add new stock"
                  icon={ShoppingCart}
                />
              </m.div>

              <m.div
                variants={fadeUp}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
              >
                <ActionCard
                  href={`/admin/discard${qp}`}
                  title="Discard"
                  subtitle="Lost / damaged out"
                  icon={Trash2}
                />
              </m.div>
            </>
          ) : (
            <>
              <m.div
                variants={fadeUp}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
              >
                <ActionCard
                  href={`/app/stock${qp}`}
                  title="Stock"
                  subtitle="View balances"
                  icon={Zap}
                  badge="Live"
                />
              </m.div>

              <m.div
                variants={fadeUp}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
              >
                <ActionCard
                  href={`/app/txns${qp}`}
                  title="Logs"
                  subtitle="Recent entries"
                  icon={BarChart3}
                />
              </m.div>
            </>
          )}
        </div>

        {isAdmin ? (
          <m.div
            variants={fadeUp}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <div className="grid grid-cols-2 gap-3">
              <ActionCard
                href={`/admin/settings${qp}`}
                title="Settings"
                subtitle="Masters & access"
                icon={Settings}
              />
              <ActionCard
                href={`/admin/reports${qp}`}
                title="Reports"
                subtitle="Pending & analytics"
                icon={BarChart3}
              />
            </div>
          </m.div>
        ) : null}
      </m.div>
    </LazyMotion>
  );
}
