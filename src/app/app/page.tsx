import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { QuickActions } from "@/components/dashboard/QuickActions";
import { TodayTiles } from "@/components/dashboard/TodayTiles";
import { VendorPendingTop } from "@/components/dashboard/VendorPendingTop";
import {
  PropertySelector,
  type PropertyLite,
} from "@/components/dashboard/PropertySelector";
import { EmptyStateNoProperty } from "@/components/dashboard/EmptyStateNoProperty";

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
      <div className="mx-auto w-full max-w-md px-4 pt-4 pb-24">
        <EmptyStateNoProperty />
      </div>
    );
  }

  const sp = await searchParams;
  const propertyIdParam = sp.propertyId;
  const hasParamAccess =
    !!propertyIdParam && properties.some((p) => p.id === propertyIdParam);

  // URL behavior:
  // - if not provided and exactly 1 доступ => auto use it (redirect with ?propertyId=)
  if (!propertyIdParam && properties.length === 1) {
    // this page lives at /app, so redirect there (not root '/') so the
    // dashboard server component receives the query param and can fetch data
    redirect(`/app?propertyId=${encodeURIComponent(properties[0].id)}`);
  }

  // If provided but invalid/not accessible:
  // - if only 1 property => redirect to it
  // - else drop param and show selector state
  if (propertyIdParam && !hasParamAccess) {
    if (properties.length === 1) {
      redirect(`/app?propertyId=${encodeURIComponent(properties[0].id)}`);
    }
    // drop the invalid param but keep the user on /app
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
    <div className="mx-auto w-full max-w-md px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold leading-tight">Dashboard</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {selectedProperty ? (
              <>
                Property:{" "}
                <span className="font-medium text-foreground">
                  {selectedProperty.name}
                </span>
              </>
            ) : (
              <>Select a property to see pending & today totals</>
            )}
          </div>
        </div>

        {/* Show selector ONLY if user has >1 accessible properties */}
        {properties.length > 1 ? (
          <PropertySelector
            properties={properties}
            selectedPropertyId={selectedPropertyId}
          />
        ) : null}
      </div>

      <Separator className="my-4" />

      {/* What do I do now? */}
      <div className="mb-3 text-sm font-medium">Quick actions</div>
      <QuickActions propertyId={selectedPropertyId} />

      <Separator className="my-4" />

      {/* What’s pending? */}
      <div className="mb-3 text-sm font-medium">Pending</div>
      {selectedPropertyId && topVendors ? (
        <VendorPendingTop propertyId={selectedPropertyId} rows={topVendors} />
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-4" />

      {/* Today totals */}
      <div className="mb-3 text-sm font-medium">Today</div>
      {summary ? (
        <TodayTiles summary={summary} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-[78px] rounded-xl" />
          <Skeleton className="h-[78px] rounded-xl" />
          <Skeleton className="h-[78px] rounded-xl" />
          <Skeleton className="h-[78px] rounded-xl" />
        </div>
      )}
    </div>
  );
}
