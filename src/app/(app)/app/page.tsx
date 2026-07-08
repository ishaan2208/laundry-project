import { prisma } from "@/lib/db";
import { requireUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { PropertyLite } from "@/components/dashboard/PropertySelector";
import { RememberProperty } from "@/components/RememberProperty";
import { resolvePropertyId } from "@/lib/propertyPref.server";

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
      <DashboardShell
        isAdmin={isAdmin(user)}
        properties={[]}
        selectedPropertyId={undefined}
        selectedProperty={undefined}
        summary={null}
        topVendors={null}
        showNoPropertyAssigned
      />
    );
  }

  const sp = await searchParams;
  const propertyIdParam = sp.propertyId;

  // Invalid deep link: drop the param, memory takes over below.
  if (
    propertyIdParam &&
    !properties.some((p) => p.id === propertyIdParam)
  ) {
    redirect(`/app`);
  }

  // URL param → remembered cookie → the only accessible hotel.
  const selectedPropertyId = await resolvePropertyId(
    propertyIdParam,
    properties
  );
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
    <div className="mx-auto w-full px-4 pt-3 pb-6">
      <RememberProperty propertyId={selectedPropertyId} />
      <DashboardShell
        isAdmin={isAdmin(user)}
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        selectedProperty={selectedProperty}
        summary={summary}
        topVendors={topVendors}
      />
    </div>
  );
}
