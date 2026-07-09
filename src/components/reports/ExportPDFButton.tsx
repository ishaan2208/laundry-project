"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { FileDown, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import type { CalendarReportPDFProps } from "@/components/reports/CalendarReportHTML";
import { DETAIL_SHEET_DESIGNS, type DetailSheetDesign } from "@/components/reports/detail-sheet";
import { TxnType } from "@/generated/prisma";
import { cn } from "@/lib/utils";

type LaundryTransactionType =
    | typeof TxnType.DISPATCH_TO_LAUNDRY
    | typeof TxnType.RECEIVE_FROM_LAUNDRY;

const toTransactionType = (
    t: LaundryTransactionType
): CalendarReportPDFProps["transactionType"] =>
    t === TxnType.DISPATCH_TO_LAUNDRY ? "DISPATCH_TO_LAUNDRY" : "RECEIVE_FROM_LAUNDRY";

type ExportPDFButtonProps = {
    propertyName: string;
    vendorName: string;
    month: string;
    transactionType: LaundryTransactionType;
    dateHeaders: string[];
    rows: CalendarReportPDFProps["rows"];
    checkoutRoomsByDate?: Record<string, number>;
    disabled?: boolean;
};

export function ExportPDFButton({
    propertyName,
    vendorName,
    month,
    transactionType,
    dateHeaders,
    rows,
    checkoutRoomsByDate,
    disabled,
}: ExportPDFButtonProps) {
    const [open, setOpen] = useState(false);
    const [design, setDesign] = useState<DetailSheetDesign>("register");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleExport = async () => {
        if (!rows.length) return;

        setIsGenerating(true);
        try {
            const props: CalendarReportPDFProps = {
                propertyName,
                vendorName,
                month,
                transactionType: toTransactionType(transactionType),
                dateHeaders,
                rows,
                checkoutRoomsByDate,
                design,
            };
            const res = await fetch("/api/reports/calendar-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(props),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const msg = data?.message || res.statusText || "Failed to generate PDF";
                throw new Error(msg);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            setOpen(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to generate PDF";
            console.error("Error generating PDF:", error);
            toast.error(message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="secondary" size="lg" disabled={disabled || !rows.length}>
                    <FileDown className="size-4" />
                    Export PDF
                </Button>
            </SheetTrigger>

            <SheetContent side="bottom" className="rounded-t-2xl p-2">
                <SheetHeader className="mb-1">
                    <SheetTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5" />
                        Export PDF
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-2 px-2 pb-2">
                    <Label>Design</Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {DETAIL_SHEET_DESIGNS.map((d) => {
                            const selected = design === d.id;
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => setDesign(d.id)}
                                    className={cn(
                                        "flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                                        selected
                                            ? "border-primary bg-primary/5"
                                            : "border-input hover:bg-accent"
                                    )}
                                >
                                    <div>
                                        <div className="text-sm font-medium">{d.label}</div>
                                        <div className="text-xs text-muted-foreground">{d.blurb}</div>
                                    </div>
                                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <SheetFooter>
                    <Button
                        type="button"
                        className="h-12 w-full"
                        onClick={handleExport}
                        disabled={disabled || isGenerating || !rows.length}
                    >
                        {isGenerating ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <FileDown className="size-4" />
                        )}
                        {isGenerating ? "Generating…" : "Generate PDF"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
