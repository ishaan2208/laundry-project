/**
 * CalendarReportPDF — Playwright-based PDF generation
 * ------------------------------------------------------------------
 * Re-exports types and provides client helpers that call the server API.
 * The actual PDF is generated server-side via Playwright (see /api/reports/calendar-pdf).
 */

export type { CalendarReportPDFProps } from "@/components/reports/CalendarReportHTML";

export async function generatePDFBlob(props: import("@/components/reports/CalendarReportHTML").CalendarReportPDFProps): Promise<Blob> {
    const res = await fetch("/api/reports/calendar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props),
    });
    if (!res.ok) throw new Error("Failed to generate PDF");
    return res.blob();
}

export async function openPDFInNewTab(props: import("@/components/reports/CalendarReportHTML").CalendarReportPDFProps): Promise<void> {
    const blob = await generatePDFBlob(props);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}
