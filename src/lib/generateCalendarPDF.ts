/**
 * Playwright-based PDF generation for the Calendar Report.
 * Converts HTML to PDF using headless Chromium with print-perfect layout.
 */

import { chromium } from "playwright";
import { readFileSync } from "fs";
import { join } from "path";

const REPORT_CSS = readFileSync(
    join(process.cwd(), "src/components/reports/calendar-report-print.css"),
    "utf-8"
);

const FOOTER_TEMPLATE = `
<div style="font-size: 8px; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 16px;">
  <span>ZenVana • Laundry Ledger</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>
`;

export async function generateCalendarPDF(html: string): Promise<Buffer> {
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${REPORT_CSS}</style>
</head>
<body>
  ${html}
</body>
</html>`;

    const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.setContent(fullHTML, {
            waitUntil: "networkidle",
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            landscape: true,
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: "<div></div>",
            footerTemplate: FOOTER_TEMPLATE,
            margin: { top: "24px", right: "24px", bottom: "40px", left: "24px" },
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}
