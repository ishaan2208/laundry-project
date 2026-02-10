"use client";

import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import type { CalendarReportPDFProps } from "@/components/reports/CalendarReportHTML";
import { TxnType } from "@prisma/client";

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
            };
            const res = await fetch("/api/reports/calendar-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(props),
            });
            if (!res.ok) throw new Error("Failed to generate PDF");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 1500);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={disabled || isGenerating || !rows.length}
            variant="outline"
            className="gap-2"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <FileDown className="h-4 w-4" />
                    Export PDF
                </>
            )}
        </Button>
    );
}
