import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { PageHeader } from "@/components/mobile/PageHeader";
import {
  Eraser,
  ClipboardCheck,
  ShoppingBag,
  Trash2,
  BarChart3,
  ReceiptText,
  Settings,
  History,
  ChevronRight,
} from "lucide-react";

function AdminRow(props: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className="surface press flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-tight">
          {props.title}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {props.subtitle}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default async function AdminHubPage() {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.ACCOUNTANT) {
    redirect("/app");
  }
  const admin = user.role === UserRole.ADMIN;

  return (
    <div className="min-h-dvh bg-background pb-6">
      <PageHeader
        title="Admin"
        subtitle="Manage the laundry system"
        back={false}
      />

      <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-4">
        {admin ? (
          <section aria-label="Counts and resets" className="space-y-3">
            <h2 className="px-1 text-sm font-bold text-muted-foreground">
              When numbers go wrong
            </h2>
            <AdminRow
              href="/admin/closing"
              title="Fresh start"
              subtitle="Count what's real and wipe the slate clean"
              icon={Eraser}
            />
            <AdminRow
              href="/admin/physical-stock-counts"
              title="Review staff counts"
              subtitle="Approve or reject counts staff submitted"
              icon={ClipboardCheck}
            />
          </section>
        ) : null}

        <section aria-label="Stock" className="space-y-3">
          <h2 className="px-1 text-sm font-bold text-muted-foreground">
            Stock
          </h2>
          {admin ? (
            <>
              <AdminRow
                href="/admin/procurement"
                title="New stock"
                subtitle="Add purchased linen"
                icon={ShoppingBag}
              />
              <AdminRow
                href="/admin/discard"
                title="Throw away / lost"
                subtitle="Remove linen from stock"
                icon={Trash2}
              />
            </>
          ) : null}
          <AdminRow
            href="/admin/reports/stock-audit-history"
            title="Weekly totals history"
            subtitle="Week-by-week snapshots"
            icon={History}
          />
        </section>

        <section aria-label="Money" className="space-y-3">
          <h2 className="px-1 text-sm font-bold text-muted-foreground">
            Reports &amp; money
          </h2>
          <AdminRow
            href="/admin/reports"
            title="Reports"
            subtitle="Pending, turnaround, monthly calendar"
            icon={BarChart3}
          />
          <AdminRow
            href="/admin/reports/billing"
            title="Billing"
            subtitle="What each laundry will charge"
            icon={ReceiptText}
          />
        </section>

        {admin ? (
          <section aria-label="Setup" className="space-y-3">
            <h2 className="px-1 text-sm font-bold text-muted-foreground">
              Setup
            </h2>
            <AdminRow
              href="/admin/settings"
              title="Settings"
              subtitle="Hotels, laundries, items, prices, people"
              icon={Settings}
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
