import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { PropertyLite } from "@/components/dashboard/PropertySelector";

import { getDashboardSummary } from "@/actions/reports/getDashboardSummary";
import { getTopVendorPending } from "@/actions/reports/getTopVendorPending";

async function getAccessiblePropertiesForUser(userId: string, role: UserRole) {
  if (role === UserRole.ADMIN) {
    return prisma.property.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  }

  // HOUSEKEEPING (and other non-admin roles): only assigned properties
  const rows = await prisma.userProperty.findMany({
    where: { userId, property: { isActive: true } },
    select: { property: { select: { id: true, name: true } } },
    orderBy: { property: { name: "asc" } },
  });

  return rows.map((r) => r.property);
}

export default async function DashboardPage({
  searchParams,
}: {
  // Next can pass searchParams as a Promise in some runtimes; await it below.
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const user = await requireUser();

  const properties = (await getAccessiblePropertiesForUser(
    user.id,
    user.role
  )) as PropertyLite[];

  // Housekeeping with 0 assigned properties => empty state
  if (properties.length === 0) {
    return (
      <div className="">
        <div className="">
          <DashboardShell
            isAdmin={isAdmin(user)}
            properties={[]}
            selectedPropertyId={undefined}
            selectedProperty={undefined}
            summary={null}
            topVendors={null}
            showNoPropertyAssigned
          />
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const propertyIdParam = sp.propertyId;

  const hasParamAccess =
    !!propertyIdParam && properties.some((p) => p.id === propertyIdParam);

  // URL behavior:
  // - if not provided and exactly 1 accessible => auto use it
  if (!propertyIdParam && properties.length === 1) {
    redirect(`/app?propertyId=${encodeURIComponent(properties[0].id)}`);
  }

  // If provided but invalid/not accessible:
  // - if only 1 property => redirect to it
  // - else drop param and show selector state
  if (propertyIdParam && !hasParamAccess) {
    if (properties.length === 1) {
      redirect(`/app?propertyId=${encodeURIComponent(properties[0].id)}`);
    }
    redirect(`/app`);
  }

  const selectedPropertyId = hasParamAccess ? propertyIdParam : undefined;
  const selectedProperty = selectedPropertyId
    ? properties.find((p) => p.id === selectedPropertyId)
    : undefined;

  const [summary, topVendors] = selectedPropertyId
    ? await Promise.all([
        getDashboardSummary(selectedPropertyId),
        getTopVendorPending(selectedPropertyId, 3),
      ])
    : [null, null];

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      {/* lightweight premium background (static) */}
      {/* <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/15 to-violet-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(124,58,237,0.10),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(232,121,249,0.10),transparent_35%)] dark:bg-[radial-gradient(circle_at_10%_0%,rgba(124,58,237,0.18),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(232,121,249,0.18),transparent_40%)]" />
      </div> */}

      <div className="relative mx-auto w-full px-4 pt-4 pb-24">
        <DashboardShell
          isAdmin={isAdmin(user)}
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          selectedProperty={selectedProperty}
          summary={summary}
          topVendors={topVendors}
        />
      </div>
    </div>
  );
}
