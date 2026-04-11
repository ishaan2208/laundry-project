"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { parse, format } from "date-fns";
import { TxnType } from "@/generated/prisma";

type LaundryTransactionType =
    | typeof TxnType.DISPATCH_TO_LAUNDRY
    | typeof TxnType.RECEIVE_FROM_LAUNDRY;

export function MonthlyCalendarTable(props: {
    dateHeaders: string[];
    rows: {
        linenItemId: string;
        linenItemName: string;
        dates: Record<string, number>;
        dateCosts?: Record<string, number>;
        total: number;
        totalCost?: number | null;
        unitPrice?: number | null;
    }[];
    /**
     * Optional map of checkout-room counts per day for analytics.
     * Shape: { "YYYY-MM-DD": numberOfCheckoutRooms }
     *
     * Only used when `transactionType === DISPATCH_TO_LAUNDRY`.
     */
    checkoutRoomsByDate?: Record<string, number>;
    transactionType: LaundryTransactionType;
}) {
    if (!props.rows.length) {
        return (
            <Card className="p-4">
                <div className="font-medium">No data available</div>
                <div className="mt-1 text-sm text-muted-foreground">
                    No transactions found for the selected filters.
                </div>
            </Card>
        );
    }

    // Format date header to show ordinal day (1st, 2nd, 3rd, etc.)
    function formatDateHeader(dateKey: string): string {
        try {
            const date = parse(dateKey, "yyyy-MM-dd", new Date());
            const day = format(date, "do"); // "do" gives ordinal day (1st, 2nd, 3rd, etc.)
            return day;
        } catch {
            // Fallback to just the day number if parsing fails
            const parts = dateKey.split("-");
            return parts[2] || dateKey;
        }
    }

    const isDispatch = props.transactionType === TxnType.DISPATCH_TO_LAUNDRY;

    // For each date, true if at least one row has non-zero data (day was filled)
    const dateHasData: Record<string, boolean> = {};
    for (const dateKey of props.dateHeaders) {
        dateHasData[dateKey] = props.rows.some(
            (row) => (row.dates[dateKey] ?? 0) > 0
        );
    }

    const totalCheckoutRooms =
        isDispatch && props.checkoutRoomsByDate && props.dateHeaders.length
            ? props.dateHeaders.reduce(
                (sum, d) => sum + (props.checkoutRoomsByDate![d] ?? 0),
                0
            )
            : 0;

    return (
        <Card className="p-4">
            <ScrollArea className="w-full">
                <div className="min-w-full overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="sticky left-0 z-10 bg-background border-b p-2 text-left font-semibold min-w-[150px]">
                                    Item
                                </th>
                                {props.dateHeaders.map((dateKey) => (
                                    <th
                                        key={dateKey}
                                        className="border-b p-2 text-center font-semibold min-w-[60px]"
                                    >
                                        {formatDateHeader(dateKey)}
                                    </th>
                                ))}
                                <th className="border-b p-2 text-center font-semibold min-w-[80px] bg-muted/50">
                                    Total Qty
                                </th>
                                <th className="border-b p-2 text-center font-semibold min-w-[72px] bg-muted/50">
                                    Total ratio
                                </th>
                                <th className="border-b p-2 text-center font-semibold min-w-[100px] bg-muted/50">
                                    Total Cost
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isDispatch && props.checkoutRoomsByDate && Object.keys(props.checkoutRoomsByDate).length > 0 && (
                                <tr className="border-b bg-muted/40 font-medium">
                                    <td className="sticky left-0 z-10 bg-muted/40 border-r p-2 text-sm">
                                        Checkout rooms
                                    </td>
                                    {props.dateHeaders.map((dateKey) => (
                                        <td key={dateKey} className="p-2 text-center tabular-nums text-sm">
                                            {props.checkoutRoomsByDate![dateKey] ?? "—"}
                                        </td>
                                    ))}
                                    <td className="p-2 text-center bg-muted/50">—</td>
                                    <td className="p-2 text-center bg-muted/50">—</td>
                                    <td className="p-2 text-center bg-muted/50">—</td>
                                </tr>
                            )}
                            {props.rows.map((row) => {
                                const rowTotalRatio =
                                    totalCheckoutRooms > 0
                                        ? (row.total || 0) / totalCheckoutRooms
                                        : null;
                                // Per-row average: compare each day's ratio to this item's overall ratio
                                const rowAvgRatio = rowTotalRatio;

                                return (
                                    <tr key={row.linenItemId} className="border-b hover:bg-muted/50">
                                        <td className="sticky left-0 z-10 bg-background border-r p-2 font-medium">
                                            {row.linenItemName}
                                        </td>
                                        {props.dateHeaders.map((dateKey) => {
                                            const qty = row.dates[dateKey] || 0;
                                            const dayHasData = dateHasData[dateKey];
                                            const rooms =
                                                isDispatch && props.checkoutRoomsByDate
                                                    ? props.checkoutRoomsByDate[dateKey]
                                                    : undefined;
                                            const ratio =
                                                rooms && rooms > 0 ? qty / rooms : undefined;

                                            // Only apply red/green when the day had data filled
                                            const aboveAvg =
                                                dayHasData &&
                                                rowAvgRatio != null &&
                                                ratio != null &&
                                                ratio > rowAvgRatio;
                                            const belowAvg =
                                                dayHasData &&
                                                rowAvgRatio != null &&
                                                ratio != null &&
                                                ratio < rowAvgRatio;
                                            const cellBg = aboveAvg
                                                ? "bg-red-500/15"
                                                : belowAvg
                                                    ? "bg-emerald-500/15"
                                                    : "";

                                            return (
                                                <td
                                                    key={dateKey}
                                                    className={`p-2 text-center tabular-nums text-xs leading-tight ${cellBg}`}
                                                >
                                                    <div className="font-semibold text-sm">
                                                        {dayHasData ? qty : "—"}
                                                    </div>
                                                    {isDispatch && dayHasData && ratio !== undefined && (
                                                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                                                            {ratio.toFixed(2)} / room
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="p-2 text-center font-semibold tabular-nums bg-muted/50">
                                            {row.total}
                                        </td>
                                        <td className="p-2 text-center font-semibold tabular-nums bg-muted/50">
                                            {rowTotalRatio != null
                                                ? `${rowTotalRatio.toFixed(2)} / room`
                                                : "—"}
                                        </td>
                                        <td className="p-2 text-center font-semibold tabular-nums bg-muted/50">
                                            {row.totalCost !== null && row.totalCost !== undefined
                                                ? `₹${row.totalCost.toFixed(2)}`
                                                : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </Card>
    );
}
