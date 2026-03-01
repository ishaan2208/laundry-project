/**
 * Serverless/Vercel-compatible PDF generation for the Calendar Report.
 * Uses @sparticuz/chromium + puppeteer-core to render HTML to PDF.
 * Locally: use PUPPETEER_EXECUTABLE_PATH or system Chrome on macOS.
 */

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const isServerless =
    typeof process.env.AWS_LAMBDA_FUNCTION_VERSION !== "undefined" ||
    process.env.VERCEL === "1";

function getExecutablePath(): Promise<string> {
    const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (envPath?.trim()) return Promise.resolve(envPath.trim());

    if (isServerless) return chromium.executablePath();

    // Local dev: use system Chrome on macOS so Lambda Chromium isn't used
    if (process.platform === "darwin") {
        const macChrome =
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
        if (existsSync(macChrome)) return Promise.resolve(macChrome);
    }

    return chromium.executablePath();
}

/** Lambda-safe args from @sparticuz/chromium; local Chrome needs gentler args to avoid "Execution context was destroyed". */
function getLaunchArgs(): string[] {
    if (isServerless) return chromium.args;
    return [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
    ];
}

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

    const executablePath = await getExecutablePath();
    const browser = await puppeteer.launch({
        args: getLaunchArgs(),
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
    });

    try {
        const page = await browser.newPage();
        // "load" is reliable for static HTML; networkidle0 can destroy context with local Chrome
        await page.setContent(fullHTML, {
            waitUntil: "load",
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
