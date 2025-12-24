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
  accent = "violet",
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: any;
  badge?: string;
  accent?: "violet" | "fuchsia";
}) {
  const ring =
    accent === "violet"
      ? "from-violet-600/25 to-fuchsia-600/10"
      : "from-fuchsia-600/25 to-violet-600/10";

  return (
    <Link
      href={href}
      className="block focus:outline-none focus:ring-2 focus:ring-violet-500/40 rounded-2xl"
    >
      <GlassCard className="h-full p-3 active:scale-[0.99] transition-transform">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
              "bg-gradient-to-br",
              ring,
              "ring-1 ring-white/15 dark:ring-white/10"
            )}
          >
            <Icon className="h-5 w-5 text-zinc-950/80 dark:text-white" />
          </div>

          {badge ? (
            <Badge
              variant="secondary"
              className="h-6 rounded-full border border-white/15 bg-white/55 px-2 text-[11px] dark:border-white/10 dark:bg-white/5"
            >
              {badge}
            </Badge>
          ) : (
            <div className="h-6" />
          )}
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
        {/* Primary 4 actions */}
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
              accent="violet"
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
              accent="fuchsia"
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
                  accent="violet"
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
                  accent="fuchsia"
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
                  accent="violet"
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
                  accent="fuchsia"
                />
              </m.div>
            </>
          )}
        </div>

        {/* Admin secondary */}
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
                accent="violet"
              />
              <ActionCard
                href={`/admin/reports${qp}`}
                title="Reports"
                subtitle="Pending & analytics"
                icon={BarChart3}
                accent="fuchsia"
              />
            </div>
          </m.div>
        ) : null}
      </m.div>
    </LazyMotion>
  );
}
