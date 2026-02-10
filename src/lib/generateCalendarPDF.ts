/**
 * Serverless/Vercel-compatible PDF generation for the Calendar Report.
 * Uses @sparticuz/chromium + puppeteer-core to render HTML to PDF.
 */

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
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

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });

    try {
        const page = await browser.newPage();
        await page.setContent(fullHTML, {
            waitUntil: "networkidle0",
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
