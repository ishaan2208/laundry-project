"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarRange, SlidersHorizontal } from "lucide-react";

type Opt = { id: string; name: string };

export function VendorMonthlyCleanedFilters(props: {
  properties: Opt[];
  vendors: Opt[];
  value: { propertyId: string; vendorId: string; month: string };
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [open, setOpen] = React.useState(false);
  const [propertyId, setPropertyId] = React.useState(props.value.propertyId);
  const [vendorId, setVendorId] = React.useState(props.value.vendorId);
  const [month, setMonth] = React.useState(props.value.month);

  React.useEffect(() => {
    setPropertyId(props.value.propertyId);
    setVendorId(props.value.vendorId);
    setMonth(props.value.month);
  }, [props.value.propertyId, props.value.vendorId, props.value.month]);

  function apply() {
    const next = new URLSearchParams(sp?.toString());

    if (propertyId) next.set("propertyId", propertyId);
    else next.delete("propertyId");

    if (vendorId) next.set("vendorId", vendorId);
    else next.delete("vendorId");

    if (month) next.set("month", month);
    else next.delete("month");

    router.push(`?${next.toString()}`);
    setOpen(false);
  }

  function reset() {
    setPropertyId("");
    setVendorId("");
    setMonth(props.value.month); // keep current month
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="mb-3">
          <SheetTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Report Filters
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-2">
          <div className="space-y-2">
            <Label>Property</Label>
            <Select
              value={propertyId || undefined}
              onValueChange={setPropertyId}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {props.properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select value={vendorId || undefined} onValueChange={setVendorId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {props.vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Month</Label>
            {/* native month input is fastest on phones */}
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-12 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1"
              onClick={reset}
            >
              Reset
            </Button>
            <Button
              type="button"
              className="h-12 flex-1"
              onClick={apply}
              disabled={!propertyId || !vendorId || !month}
            >
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
