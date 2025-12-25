// src/app/app/vendors/page.tsx
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LinenCondition, UserRole } from "@prisma/client";
import { getVendorPending } from "@/actions/reports/getVendorPending";
import { VendorPendingCard } from "@/components/reports/VendorPendingCard";
import { ReportFiltersSheet } from "@/components/reports/ReportFiltersSheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Building2, Filter, AlertTriangle } from "lucide-react";

function labelEnum(v: string) {
  return v.replaceAll("_", " ");
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUser();

  const propertyId =
    typeof sp.propertyId === "string" ? sp.propertyId : undefined;

  const condition =
    typeof sp.condition === "string"
      ? (sp.condition as LinenCondition)
      : undefined;

  const linenItemId =
    typeof sp.linenItemId === "string" ? sp.linenItemId : undefined;

  const properties =
    user.role === UserRole.ADMIN
      ? await prisma.property.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : await prisma.userProperty
          .findMany({
            where: { userId: user.id },
            select: { property: { select: { id: true, name: true } } },
          })
          .then((rows) => rows.map((r) => r.property));

  if (!propertyId) {
    if (properties.length === 1) {
      redirect(`/app/vendors?propertyId=${properties[0].id}`);
    }
    return (
      <div className="mx-auto w-full max-w-2xl p-3">
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600/10 text-violet-700 ring-1 ring-violet-200/60 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/15">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Select a property</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Choose a property to view vendor pending (“in laundry” stock).
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const linenItems = await prisma.linenItem.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const res = await getVendorPending({ propertyId, condition, linenItemId });
  if (!res.ok) {
    return (
      <div className="mx-auto w-full max-w-2xl p-3">
        <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
          Failed to load.
        </Card>
      </div>
    );
  }

  const propertyName = properties.find((p) => p.id === propertyId)?.name;

  const activeChips = [
    propertyName ? { k: "property", v: propertyName, icon: Building2 } : null,
    condition
      ? { k: "condition", v: labelEnum(condition), icon: Filter }
      : null,
    linenItemId
      ? {
          k: "item",
          v: linenItems.find((i) => i.id === linenItemId)?.name ?? "Item",
          icon: Filter,
        }
      : null,
  ].filter(Boolean) as { k: string; v: string; icon: any }[];

  return (
    <div className="mx-auto w-full max-w-2xl p-3">
      {/* header card */}
      <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-4 backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-700 ring-1 ring-violet-200/60 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/15">
                <Truck className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-base font-semibold">
                  Vendor Pending
                </div>
                {/* <div className="text-xs text-muted-foreground">
                  “In laundry” = stock at vendor locations
                </div> */}
              </div>
            </div>

            {/* chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {activeChips.map((c) => (
                <Badge
                  key={c.k}
                  variant="secondary"
                  className="rounded-full border border-violet-200/60 bg-white/60 text-xs backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40"
                >
                  <c.icon className="mr-1 h-3.5 w-3.5 text-violet-700 dark:text-violet-200" />
                  {c.v}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ReportFiltersSheet
              title="Pending Filters"
              buttonLabel="Filters"
              fields={[
                {
                  key: "propertyId",
                  label: "Property",
                  type: "select",
                  options: properties.map((p) => ({
                    value: p.id,
                    label: p.name,
                  })),
                },
                {
                  key: "condition",
                  label: "Condition",
                  type: "select",
                  options: Object.values(LinenCondition).map((c) => ({
                    value: c,
                    label: labelEnum(c),
                  })),
                  placeholder: "All",
                },
                {
                  key: "linenItemId",
                  label: "Item",
                  type: "select",
                  options: linenItems.map((i) => ({
                    value: i.id,
                    label: i.name,
                  })),
                  placeholder: "All",
                },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* list */}
      <div className="mt-3 grid gap-2">
        {res.vendors.length ? (
          res.vendors.map((v) => (
            <VendorPendingCard key={v.vendorId} vendor={v} />
          ))
        ) : (
          <Card className="rounded-3xl border border-violet-200/60 bg-white/60 p-5 text-sm text-muted-foreground backdrop-blur-[2px] dark:border-violet-500/15 dark:bg-zinc-950/40">
            No pending stock for current filters.
          </Card>
        )}
      </div>
    </div>
  );
}
