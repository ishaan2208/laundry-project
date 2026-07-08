import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getMonthlyCalendarReport } from "@/actions/reports/getMonthlyCalendarReport";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MonthlyCalendarFilters } from "@/components/reports/MonthlyCalendarFilters";
import { MonthlyCalendarTable } from "@/components/reports/MonthlyCalendarTable";
import { ExportPDFButton } from "@/components/reports/ExportPDFButton";
import { TxnType } from "@/generated/prisma";

type LaundryTransactionType =
  | typeof TxnType.DISPATCH_TO_LAUNDRY
  | typeof TxnType.RECEIVE_FROM_LAUNDRY;

function currentMonthYYYYMM_IST() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "2025";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = (await searchParams) as Record<string, string | undefined>;

  // ✅ Accessible properties
  const properties =
    user.role === "ADMIN"
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

  // ✅ Vendors (active)
  const vendors = await prisma.vendor.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const month = sp.month || currentMonthYYYYMM_IST();
  const transactionType: LaundryTransactionType =
    sp.transactionType === TxnType.DISPATCH_TO_LAUNDRY ||
      sp.transactionType === TxnType.RECEIVE_FROM_LAUNDRY
      ? (sp.transactionType as LaundryTransactionType)
      : TxnType.RECEIVE_FROM_LAUNDRY;

  // defaults (only auto-pick if unambiguous)
  const propertyId =
    sp.propertyId || (properties.length === 1 ? properties[0]?.id : undefined);
  const vendorId =
    sp.vendorId || (vendors.length === 1 ? vendors[0]?.id : undefined);

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const selectedVendor = vendors.find((v) => v.id === vendorId);

  const canRun = Boolean(propertyId && vendorId);

  const report = canRun
    ? await getMonthlyCalendarReport({
      propertyId: propertyId!,
      vendorId: vendorId!,
      month,
      transactionType,
    })
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold leading-tight">
            Monthly Calendar Report
          </div>
          <div className="text-sm text-muted-foreground">
            Daily breakdown by laundry item
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report?.ok && selectedProperty && selectedVendor && (
            <ExportPDFButton
              propertyName={selectedProperty.name}
              vendorName={selectedVendor.name}
              month={month}
              transactionType={transactionType}
              dateHeaders={report.dateHeaders}
              rows={report.rows}
              checkoutRoomsByDate={report.checkoutRoomsByDate}
            />
          )}
          <MonthlyCalendarFilters
            properties={properties}
            vendors={vendors}
            value={{
              propertyId: propertyId ?? "",
              vendorId: vendorId ?? "",
              month,
              transactionType,
            }}
          />
        </div>
      </div>

      {/* Active filter chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary">
          Month: <span className="ml-1 font-medium">{month}</span>
        </Badge>
        <Badge variant="secondary">
          Property:{" "}
          <span className="ml-1 font-medium">
            {selectedProperty?.name ?? "—"}
          </span>
        </Badge>
        <Badge variant="secondary">
          Vendor:{" "}
          <span className="ml-1 font-medium">
            {selectedVendor?.name ?? "—"}
          </span>
        </Badge>
        <Badge variant="secondary">
          Type:{" "}
          <span className="ml-1 font-medium">
            {transactionType === TxnType.DISPATCH_TO_LAUNDRY
              ? "Dispatched"
              : "Received"}
          </span>
        </Badge>
      </div>

      <Separator className="my-4" />

      {/* Empty states */}
      {properties.length === 0 ? (
        <Card className="p-4 m-1">
          <div className="font-medium">No property assigned</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Ask admin to assign you a property.
          </div>
        </Card>
      ) : !canRun ? (
        <Card className="p-4">
          <div className="font-medium">Select property + vendor</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Tap <span className="font-medium">Filters</span> and choose both to
            view the report.
          </div>
        </Card>
      ) : report?.ok ? (
        <MonthlyCalendarTable
          dateHeaders={report.dateHeaders}
          rows={report.rows}
          checkoutRoomsByDate={report.checkoutRoomsByDate}
          transactionType={transactionType}
        />
      ) : (
        <Card className="p-4">
          <div className="font-medium">Couldn&apos;t load report</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Please try again.
          </div>
        </Card>
      )}
    </div>
  );
}
