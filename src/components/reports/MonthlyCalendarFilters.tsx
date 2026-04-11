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
import { TxnType } from "@/generated/prisma";
import { parse } from "date-fns";

type Opt = { id: string; name: string };

type LaundryTransactionType =
    | typeof TxnType.DISPATCH_TO_LAUNDRY
    | typeof TxnType.RECEIVE_FROM_LAUNDRY;

export function MonthlyCalendarFilters(props: {
    properties: Opt[];
    vendors: Opt[];
    value: {
        propertyId: string;
        vendorId: string;
        month: string;
        transactionType: LaundryTransactionType;
    };
}) {
    const router = useRouter();
    const sp = useSearchParams();

    const [open, setOpen] = React.useState(false);
    const [propertyId, setPropertyId] = React.useState(props.value.propertyId);
    const [vendorId, setVendorId] = React.useState(props.value.vendorId);
    const [month, setMonth] = React.useState(props.value.month);
    const [transactionType, setTransactionType] = React.useState<LaundryTransactionType>(
        props.value.transactionType
    );

    // Parse month string (YYYY-MM) into year and month
    const currentDate = React.useMemo(() => {
        try {
            return parse(month + "-01", "yyyy-MM-dd", new Date());
        } catch {
            return new Date();
        }
    }, [month]);

    const selectedYear = currentDate.getFullYear();
    const selectedMonth = currentDate.getMonth() + 1; // 1-12

    // Generate year options (current year ± 5 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    // Month names
    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
    ];

    function handleMonthYearChange(year: number, monthNum: number) {
        const newMonth = `${year}-${String(monthNum).padStart(2, "0")}`;
        setMonth(newMonth);
    }

    React.useEffect(() => {
        setPropertyId(props.value.propertyId);
        setVendorId(props.value.vendorId);
        setMonth(props.value.month);
        setTransactionType(props.value.transactionType);
    }, [
        props.value.propertyId,
        props.value.vendorId,
        props.value.month,
        props.value.transactionType,
    ]);

    function apply() {
        const next = new URLSearchParams(sp?.toString());

        if (propertyId) next.set("propertyId", propertyId);
        else next.delete("propertyId");

        if (vendorId) next.set("vendorId", vendorId);
        else next.delete("vendorId");

        if (month) next.set("month", month);
        else next.delete("month");

        if (transactionType) next.set("transactionType", transactionType);
        else next.delete("transactionType");

        router.push(`?${next.toString()}`);
        setOpen(false);
    }

    function reset() {
        setPropertyId("");
        setVendorId("");
        setMonth(props.value.month); // keep current month
        setTransactionType(TxnType.RECEIVE_FROM_LAUNDRY);
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="h-10 gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                </Button>
            </SheetTrigger>

            <SheetContent side="bottom" className="rounded-t-2xl p-2">
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
                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                value={String(selectedMonth)}
                                onValueChange={(value) =>
                                    handleMonthYearChange(selectedYear, parseInt(value))
                                }
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m) => (
                                        <SelectItem key={m.value} value={String(m.value)}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={String(selectedYear)}
                                onValueChange={(value) =>
                                    handleMonthYearChange(parseInt(value), selectedMonth)
                                }
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={String(y)}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={transactionType || undefined}
                            onValueChange={(value) =>
                                setTransactionType(value as LaundryTransactionType)
                            }
                        >
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TxnType.DISPATCH_TO_LAUNDRY}>
                                    Dispatched
                                </SelectItem>
                                <SelectItem value={TxnType.RECEIVE_FROM_LAUNDRY}>
                                    Received
                                </SelectItem>
                            </SelectContent>
                        </Select>
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
                            disabled={!propertyId || !vendorId || !month || !transactionType}
                        >
                            Apply
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
