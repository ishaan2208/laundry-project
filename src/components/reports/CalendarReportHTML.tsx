/**
 * CalendarReportHTML — dispatches to one of the 4 laundry detail-sheet designs
 * (Register / Swiss / Almanac / Atlas), each a monochrome A4-landscape print
 * document. Rendered server-side to a string, then piped through Playwright/
 * Puppeteer for PDF generation (see /api/reports/calendar-pdf).
 */

import React from "react";
import { TxnType } from "@/generated/prisma";
import {
    buildEngine,
    renderDetailSheet,
    isDetailSheetDesign,
    type DetailSheetDesign,
} from "./detail-sheet";
import { DETAIL_SHEET_BASE_CSS } from "./detail-sheet";

export type CalendarReportPDFProps = {
    propertyName: string;
    vendorName: string;
    month: string; // "YYYY-MM"
    transactionType:
    | typeof TxnType.DISPATCH_TO_LAUNDRY
    | typeof TxnType.RECEIVE_FROM_LAUNDRY;
    dateHeaders: string[]; // ["YYYY-MM-DD"...]
    rows: {
        linenItemId: string;
        linenItemName: string;
        dates: Record<string, number>;
        dateCosts?: Record<string, number>;
        total: number;
        totalCost?: number | null;
        unitPrice?: number | null;
    }[];
    checkoutRoomsByDate?: Record<string, number>;
    barcodeData?: string;
    /** Which of the 4 detail-sheet designs to render. Defaults to "register". */
    design?: DetailSheetDesign;
};

export function CalendarReportHTML(props: CalendarReportPDFProps) {
    const design = isDetailSheetDesign(props.design) ? props.design : "register";
    const { engine, ctx } = buildEngine(props);

    if (!props.rows.length) {
        return (
            <div className="sheet" data-design={design}>
                <style dangerouslySetInnerHTML={{ __html: DETAIL_SHEET_BASE_CSS }} />
                <div style={{ padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>No rows to display</div>
                    <div style={{ marginTop: 6, fontSize: 10, color: "#5c5c5c" }}>
                        This report has an empty dataset for the selected month.
                    </div>
                </div>
            </div>
        );
    }

    const { css, html } = renderDetailSheet(design, engine, ctx);

    return (
        <div className="sheet" data-design={design}>
            <style dangerouslySetInnerHTML={{ __html: DETAIL_SHEET_BASE_CSS + css }} />
            <div className="sheet-body" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}
