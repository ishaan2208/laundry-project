"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  ArrowRightLeft,
  PackagePlus,
  Inbox,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/mobile/PageHeader";
import { BottomSheetSelect } from "@/components/mobile/BottomSheetSelect";
import { useBootstrap } from "@/hooks/useBootstrap";
import { getDashboardSummary } from "@/actions/ui/getDashboardSummary";

const LS_PROPERTY = "laundry:lastPropertyId";

export default function DashboardPage() {
  const boot = useBootstrap();
  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [vendorTop, setVendorTop] = React.useState<
    { vendorId: string; vendorName: string; pendingQty: number }[]
  >([]);
  const [loadingSummary, setLoadingSummary] = React.useState(false);

  React.useEffect(() => {
    if (!boot.data?.properties?.length) return;
    const saved = localStorage.getItem(LS_PROPERTY);
    const first = boot.data.properties[0].id;
    setPropertyId(
      saved && boot.data.properties.some((p) => p.id === saved) ? saved : first
    );
  }, [boot.data?.properties]);

  React.useEffect(() => {
    if (!propertyId) return;
    localStorage.setItem(LS_PROPERTY, propertyId);

    (async () => {
      setLoadingSummary(true);
      const res = await getDashboardSummary({ propertyId });
      if (res.ok) setVendorTop(res.vendorPendingTop);
      setLoadingSummary(false);
    })();
  }, [propertyId]);

  const propsOptions =
    boot.data?.properties.map((p) => ({ value: p.id, label: p.name })) ?? [];

  return (
    <div className="min-h-dvh">
      <PageHeader
        title="Laundry"
        back={false}
        right={<div className="text-xs text-muted-foreground">Mobile Ops</div>}
      />

      <main className="mx-auto w-full max-w-md space-y-4 px-3 pb-24 pt-4">
        {boot.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
        ) : (
          <>
            <BottomSheetSelect
              label="Property"
              value={propertyId}
              options={propsOptions}
              onChange={(v) => setPropertyId(v)}
              placeholder="Select property"
              disabled={!propsOptions.length}
            />

            <div className="grid grid-cols-2 gap-3">
              <Link href="/dispatch">
                <Card className="rounded-3xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <ArrowRightLeft className="h-4 w-4" />
                      Dispatch
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Send soiled to laundry
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/receive">
                <Card className="rounded-3xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Inbox className="h-4 w-4" />
                      Receive
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Receive clean / damaged
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/procurement">
                <Card className="rounded-3xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <PackagePlus className="h-4 w-4" />
                      Procurement
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Add new stock
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/discard">
                <Card className="rounded-3xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Trash2 className="h-4 w-4" />
                      Discard
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Damage / lost
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <Card className="rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Vendor Pending</div>
                  <Building2 className="h-4 w-4 opacity-70" />
                </div>

                {loadingSummary ? (
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>
                ) : vendorTop.length ? (
                  <div className="mt-3 space-y-2">
                    {vendorTop.map((v) => (
                      <div
                        key={v.vendorId}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="truncate">{v.vendorName}</div>
                        <div className="rounded-full border px-2 py-0.5 text-xs">
                          {v.pendingQty}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-muted-foreground">
                    No pending right now.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="p-4">
                <div className="text-sm font-semibold">Alerts</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  (Placeholder) Low stock / negative-risk alerts will appear
                  here.
                </div>
              </CardContent>
            </Card>

            <div className="pt-2">
              <Button
                asChild
                variant="secondary"
                className="h-12 w-full rounded-2xl"
              >
                <Link href="/txns">View Transactions</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
