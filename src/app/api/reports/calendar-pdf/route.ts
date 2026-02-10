import { NextResponse } from "next/server";
import React from "react";
import { requireUser } from "@/lib/auth";
import { generateCalendarPDF } from "@/lib/generateCalendarPDF";
import { CalendarReportHTML } from "@/components/reports/CalendarReportHTML";
import type { CalendarReportPDFProps } from "@/components/reports/CalendarReportHTML";

export async function POST(req: Request) {
    await requireUser();

    let body: CalendarReportPDFProps;
    try {
        body = (await req.json()) as CalendarReportPDFProps;
    } catch {
        return NextResponse.json({ ok: false, message: "Invalid JSON body" }, { status: 400 });
    }

    const { propertyName, vendorName, month, transactionType, dateHeaders, rows, checkoutRoomsByDate, barcodeData } = body;

    if (!propertyName || !vendorName || !month || !transactionType || !dateHeaders || !rows) {
        return NextResponse.json(
            { ok: false, message: "Missing required fields: propertyName, vendorName, month, transactionType, dateHeaders, rows" },
            { status: 400 }
        );
    }

    try {
        const props = {
            propertyName,
            vendorName,
            month,
            transactionType,
            dateHeaders,
            rows,
            checkoutRoomsByDate,
            barcodeData,
        };
        const { renderToStaticMarkup } = await import("react-dom/server");
        const html = renderToStaticMarkup(React.createElement(CalendarReportHTML, props));
        const buffer = await generateCalendarPDF(html);

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="laundry-report-${month}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Calendar PDF generation failed:", error);
        return NextResponse.json(
            { ok: false, message: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
