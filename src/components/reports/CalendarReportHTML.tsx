/**
 * CalendarReportHTML — 2030-grade HTML for Playwright PDF (Next.js)
 * ----------------------------------------------------------------
 * Redesign from scratch with ONE obsession: table readability at print time.
 *
 * Key qualities:
 * - A4 landscape, monochrome, printBackground-friendly
 * - True semantic <table> with repeating <thead>
 * - Page-break safe rows + “rails” that don’t split awkwardly
 * - Missing cell => "···" (not zero), explicit 0 => "0"
 * - Icons used as “scan accelerators” (not decoration)
 *
 * Typical usage:
 * 1) Render server-side to HTML string
 * 2) page.setContent(html, { waitUntil: "networkidle" })
 * 3) page.pdf({ format: "A4", landscape: true, printBackground: true })
 */

import React from "react";
import { format, parse, isValid, isWeekend } from "date-fns";
import { TxnType } from "@prisma/client";

// ---------------- Types ----------------
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
};

// ---------------- Tokens ----------------
const UI = {
    ink: "#111111",
    ink2: "#1A1A1A",
    muted: "#5B5B5B",
    faint: "#7A7A7A",
    ghost: "#9A9A9A",
    line: "#D7D7DB",
    line2: "#BDBDC4",
    paper: "#FFFFFF",
    soft: "#F3F3F5",
    soft2: "#ECECEF",
    zebra: "#F7F7F9",
    weekend: "#F1F1F4",
    // “heat” stays subtle so numbers remain dominant
    heat1: "#F4F4F6",
    heat2: "#ECECF0",
    heat3: "#E1E1E7",
    heat4: "#D5D5DD",
} as const;

const PAGE = {
    marginPx: 28,
    // “layout math only” – Chromium-ish A4 landscape width at 96dpi
    a4LandscapeWidthPx: 842,
};

type CellState =
    | { kind: "missing" }
    | { kind: "zero" }
    | { kind: "value"; qty: number };

// ---------------- Helpers ----------------
function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function safeText(v: unknown, fallback = "—") {
    if (v === null || v === undefined) return fallback;
    const s = String(v).trim();
    return s.length ? s : fallback;
}

function safeParseDate(dateKey: string) {
    const d = parse(dateKey, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : null;
}

function dd(dateKey: string) {
    const d = safeParseDate(dateKey);
    if (d) return format(d, "d");
    const parts = dateKey.split("-");
    return parts[2] || dateKey;
}

function dow2(dateKey: string) {
    const d = safeParseDate(dateKey);
    return d ? format(d, "EEE").slice(0, 2).toUpperCase() : "";
}

function monthLong(month: string) {
    try {
        const [y, m] = month.split("-");
        const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        return format(d, "MMMM yyyy");
    } catch {
        return month;
    }
}

function monthShort(month: string) {
    try {
        const [y, m] = month.split("-");
        const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        return format(d, "MMM yyyy");
    } catch {
        return month;
    }
}

function isDispatch(txn: CalendarReportPDFProps["transactionType"]) {
    return txn === TxnType.DISPATCH_TO_LAUNDRY;
}

function transactionLabel(txn: CalendarReportPDFProps["transactionType"]) {
    return txn === TxnType.DISPATCH_TO_LAUNDRY ? "Dispatched" : "Received";
}

function moneyINR(n: number) {
    const v = Number.isFinite(n) ? n : 0;
    return `INR ${v.toFixed(2)}`;
}

function sumRecord(map: Record<string, number> | undefined) {
    if (!map) return 0;
    let s = 0;
    for (const k of Object.keys(map)) {
        const v = map[k];
        if (typeof v === "number" && Number.isFinite(v)) s += v;
    }
    return s;
}

function getRowTotalCost(row: CalendarReportPDFProps["rows"][number]): number | null {
    if (row.totalCost != null && Number.isFinite(row.totalCost)) return row.totalCost;

    const dc = sumRecord(row.dateCosts);
    if (dc > 0) return dc;

    if (row.unitPrice != null && Number.isFinite(row.unitPrice)) {
        const qty = typeof row.total === "number" && Number.isFinite(row.total) ? row.total : 0;
        const computed = row.unitPrice * qty;
        return Number.isFinite(computed) ? computed : null;
    }

    return null;
}

function sumAll(rows: CalendarReportPDFProps["rows"]) {
    let totalQty = 0;
    let totalCost = 0;
    for (const r of rows || []) {
        totalQty += r.total || 0;
        const rc = getRowTotalCost(r);
        if (rc != null) totalCost += rc;
    }
    return { totalQty, totalCost };
}

function getCellState(dates: Record<string, number> | undefined, dateKey: string): CellState {
    if (!dates) return { kind: "missing" };
    if (!Object.prototype.hasOwnProperty.call(dates, dateKey)) return { kind: "missing" };

    const v = dates[dateKey];
    if (v === 0) return { kind: "zero" };
    if (v === null || v === undefined) return { kind: "zero" };
    if (typeof v !== "number" || Number.isNaN(v)) return { kind: "zero" };
    return { kind: "value", qty: v };
}

function heatFor(qty: number, maxQty: number) {
    if (maxQty <= 0) return UI.paper;
    const t = qty / maxQty;
    if (t <= 0.15) return UI.heat1;
    if (t <= 0.35) return UI.heat2;
    if (t <= 0.6) return UI.heat3;
    return UI.heat4;
}

/**
 * Width strategy:
 * - Keep item column compact but readable (no over-wide)
 * - Date columns adapt, but never become illegible
 * - Totals stay consistent and “anchored” with thicker borders
 */
function computeWidths(dateCount: number, showRatio: boolean) {
    const usable = PAGE.a4LandscapeWidthPx - PAGE.marginPx * 2;

    const itemW = 170; // compact, but enough for 1–2 lines
    const totalW = 84; // totals need breathing space
    const ratioW = showRatio ? 74 : 0;

    const fixedRight = totalW * 2 + ratioW;
    const remaining = usable - itemW - fixedRight;

    const dateW = clamp(Math.floor(remaining / Math.max(1, dateCount)), 15, 26);
    const dense = dateCount >= 27;

    return { itemW, dateW, totalW, ratioW, dense };
}

/**
 * Barcode-ish (intentional looking, not a standards barcode)
 */
function barcodeToBars(data: string): number[] {
    const bars: number[] = [];
    bars.push(2, 1, 2, 1); // guard
    for (let i = 0; i < data.length; i++) {
        const c = data.charCodeAt(i);
        bars.push((c & 1) ? 2 : 1, (c & 2) ? 2 : 1, (c & 4) ? 2 : 1, 1);
    }
    bars.push(2, 1, 2, 1);
    return bars;
}

// ---------------- Icons (inline SVG, monochrome) ----------------
const ICONS: Record<string, string[]> = {
    doc: ["M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z", "M9 8h6M9 12h6M9 16h4"],
    cal: ["M3 5h18v16H3V5z", "M8 3v4M16 3v4", "M3 9h18"],
    bld: ["M4 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16", "M8 7h3M8 11h3M8 15h3", "M12 21v-4h4v4"],
    home: ["M4 10l8-6 8 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z", "M9 22V14h6v8"],
    tag: ["M20 12V7a2 2 0 0 0-2-2h-5L4 14l6 6 10-10z", "M16 7h.01"],
    sum: ["M5 3h14v18H5z", "M8 7h8M8 11h8M8 15h6", "M9 3v18"],
    room: ["M4 7h16v13H4V7z", "M7 20v-3M17 20v-3", "M9 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", "M12 12h6"],
    info: ["M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z", "M12 16v-4", "M12 8h.01"],
};

function Icon({
    name,
    size = 14,
    color = UI.ink2,
}: {
    name: keyof typeof ICONS;
    size?: number;
    color?: string;
}) {
    const paths = ICONS[name] ?? [];
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
        >
            {paths.map((d, i) => (
                <path key={i} d={d} />
            ))}
        </svg>
    );
}

// ---------------- Print CSS (embedded) ----------------
const PRINT_CSS = `
:root{
  --paper:${UI.paper};
  --ink:${UI.ink};
  --ink2:${UI.ink2};
  --muted:${UI.muted};
  --faint:${UI.faint};
  --ghost:${UI.ghost};
  --line:${UI.line};
  --line2:${UI.line2};
  --soft:${UI.soft};
  --soft2:${UI.soft2};
  --zebra:${UI.zebra};
  --weekend:${UI.weekend};
  --heat1:${UI.heat1};
  --heat2:${UI.heat2};
  --heat3:${UI.heat3};
  --heat4:${UI.heat4};
}

/* global */
*{ box-sizing:border-box; }
html, body{ margin:0; padding:0; background:var(--paper); color:var(--ink); }
body{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", sans-serif; }

/* A4 landscape */
@page { size: A4 landscape; margin: ${PAGE.marginPx}px; }

/* Make printed greys actually print */
@media print{
  *{ -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  thead{ display: table-header-group; }
  tfoot{ display: table-footer-group; }
}

/* Outer stage — no min-height so PDF is only as tall as content (avoids extra blank page) */
.stage{
  width: 297mm;
  background: var(--paper);
  font-size: 10px;
  line-height: 1.22;
}

/* Header: ultra-clean rail */
.topRail{
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
  background: var(--soft);
  page-break-inside: avoid;
  break-inside: avoid;
}

.topRailInner{
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
  align-items: start;
}

.brandLine{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 12px;
}

.titleStack{
  display:flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.h1{
  display:flex;
  align-items:center;
  gap: 10px;
  font-size: 18px;
  font-weight: 950;
  letter-spacing: 0.2px;
  color: var(--ink);
  margin:0;
}

.sub{
  margin:0;
  font-size: 8.6px;
  color: var(--muted);
  letter-spacing: 0.15px;
}

.legendRow{
  margin-top: 8px;
  display:flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pillLegend{
  display:inline-flex;
  align-items:center;
  gap: 7px;
  padding: 6px 10px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 8.2px;
  color: var(--muted);
}

.dotMark{
  display:inline-block;
  padding: 1px 7px;
  border: 1px dotted var(--line2);
  border-radius: 10px;
  letter-spacing: 1.6px;
  color: var(--ghost);
  font-weight: 900;
}

.zeroMark{
  display:inline-block;
  padding: 1px 7px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--muted);
  font-weight: 900;
}

.summaryBox{
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 10px;
}

.summaryGrid{
  display:grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.kv{
  display:flex;
  align-items:center;
  gap: 8px;
  min-width: 0;
}

.kvLabel{
  font-size: 8px;
  color: var(--faint);
  letter-spacing: 0.9px;
  font-weight: 900;
  white-space: nowrap;
}

.kvValue{
  margin-left: auto;
  font-size: 9.6px;
  font-weight: 950;
  color: var(--ink2);
  white-space: nowrap;
  overflow:hidden;
  text-overflow: ellipsis;
  max-width: 210px;
}

.hrDash{
  height: 0;
  border: 0;
  border-top: 1px dashed var(--line2);
  margin: 10px 0 0;
}

/* Table wrap */
.sheet{
  margin-top: 10px;
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
  background: var(--paper);
}

/* Table */
table{
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* Column header — compact height */
thead th{
  background: var(--soft2);
  border-bottom: 2px solid var(--ink);
  color: var(--ink2);
  height: 28px;
  padding: 4px 4px;
  font-size: 8px;
  letter-spacing: 0.9px;
  font-weight: 950;
}

th, td{ border-right: 1px solid var(--line); }
th:last-child, td:last-child{ border-right: none; }

/* Dense months */
.dense thead th{ font-size: 7.5px; height: 26px; }

/* Weekend wash (apply class on th/td) */
.wknd{ background: var(--weekend) !important; }

/* Body — save height in rows */
tbody td{
  border-bottom: 1px solid var(--line);
  padding: 3px 4px;
  vertical-align: middle;
}

tbody tr:nth-child(even){ background: var(--zebra); }

/* Avoid row splitting */
tbody tr{ break-inside: avoid; page-break-inside: avoid; }

/* Item cell — compact */
.item{
  padding: 4px 8px !important;
}

.itemName{
  display:block;
  font-size: 9.6px;
  font-weight: 950;
  color: var(--ink2);
  line-height: 1.1;
  margin-bottom: 1px;
  word-break: break-word;
}

.itemMeta{
  display:flex;
  align-items:center;
  gap: 8px;
  font-size: 7.8px;
  color: var(--faint);
}

.itemMeta strong{
  color: var(--ink2);
  font-weight: 900;
}

/* Date cells: make numbers “pop” without shouting */
.cell{
  text-align: center;
}

.badge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width: 16px;
  padding: 2px 5px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--paper);
  font-weight: 950;
  font-size: 8px;
  color: var(--ink2);
}

.badge.missing{
  border-style: dotted;
  border-color: var(--line2);
  color: var(--ghost);
  letter-spacing: 1.6px;
}

.badge.zero{
  color: var(--muted);
}

.badge.heat1{ background: var(--heat1); }
.badge.heat2{ background: var(--heat2); }
.badge.heat3{ background: var(--heat3); }
.badge.heat4{ background: var(--heat4); }

/* Totals: “anchored” columns */
.anchorL{ border-left: 2px solid var(--ink) !important; }
.anchorR{ border-right: 2px solid var(--ink) !important; }

.tot{
  text-align: right;
  padding: 3px 8px !important;
}

.totBox{
  display:inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  padding: 2px 6px;
  border: 1px solid var(--line2);
  border-radius: 10px;
  background: var(--paper);
  min-width: 74px;
}

.totVal{
  font-size: 9px;
  font-weight: 950;
  color: var(--ink2);
}

.totHint{
  font-size: 7.4px;
  color: var(--faint);
}

/* Footer total row — compact */
tfoot td{
  background: var(--soft);
  border-top: 2px solid var(--ink);
  padding: 4px 8px;
  font-weight: 950;
  color: var(--ink2);
  font-size: 9px;
}

tfoot .grand{
  letter-spacing: 0.8px;
}

/* Bottom rail (sign + barcode) */
.bottomRail{
  margin-top: 10px;
  display:flex;
  gap: 10px;
  align-items: flex-end;
  justify-content: space-between;
  page-break-inside: avoid;
  break-inside: avoid;
}

.signRow{
  display:flex;
  gap: 10px;
  align-items: flex-end;
  flex: 1;
}

.sign{
  width: 230px;
  border: 1px solid var(--line);
  background: var(--soft);
  border-radius: 16px;
  padding: 8px 10px;
}

.signTitle{
  font-size: 8.6px;
  font-weight: 950;
  color: var(--ink2);
  display:flex;
  align-items:center;
  gap: 7px;
}

.signLine{
  height: 26px;
  margin-top: 7px;
  border-bottom: 1px solid var(--line2);
}

.signHint{
  margin-top: 5px;
  font-size: 7.6px;
  color: var(--muted);
}

.brandStamp{
  text-align:right;
  font-size: 8px;
  color: var(--faint);
  line-height: 1.2;
  flex-shrink: 0;
}

/* Make the date header stack compact */
.thDate{
  display:flex;
  flex-direction: column;
  align-items:center;
  gap: 0;
  line-height: 1.02;
}

.thDow{
  font-size: 7.2px;
  letter-spacing: 0.8px;
  color: var(--muted);
}

.thDay{
  font-size: 10.2px;
  font-weight: 950;
  letter-spacing: 0.2px;
  color: var(--ink2);
}

.dense .thDay{ font-size: 9.6px; }

/* Tiny microcopy */
.monoSmall{
  font-feature-settings: "tnum" 1, "lnum" 1;
}
`;

// ---------------- Main Component ----------------
export function CalendarReportHTML(props: CalendarReportPDFProps) {
    const {
        propertyName,
        vendorName,
        month,
        transactionType,
        dateHeaders,
        rows,
        checkoutRoomsByDate,
        barcodeData,
    } = props;

    const dispatchMode = isDispatch(transactionType);
    const showRatio = dispatchMode && !!checkoutRoomsByDate;

    const { itemW, dateW, totalW, ratioW, dense } = computeWidths(dateHeaders.length, showRatio);
    const { totalQty, totalCost } = sumAll(rows);

    // weekend flags
    const weekendByDate: Record<string, boolean> = {};
    for (const d of dateHeaders) {
        const dt = safeParseDate(d);
        weekendByDate[d] = dt ? isWeekend(dt) : false;
    }

    // For each date, true if at least one row has non-zero data (day was filled)
    const dateHasData: Record<string, boolean> = {};
    for (const d of dateHeaders) {
        dateHasData[d] = (rows || []).some((row) => (row.dates[d] ?? 0) > 0);
    }

    // heat calibration (max observed qty)
    let maxQty = 0;
    for (const r of rows || []) {
        for (const d of dateHeaders || []) {
            const st = getCellState(r?.dates, d);
            if (st.kind === "value") maxQty = Math.max(maxQty, st.qty);
        }
    }

    const generatedAt = format(new Date(), "dd MMM yyyy • HH:mm");

    const totalCheckoutRooms =
        showRatio && checkoutRoomsByDate
            ? dateHeaders.reduce((sum, d) => sum + (checkoutRoomsByDate[d] ?? 0), 0)
            : 0;

    const overallRatio =
        showRatio && totalCheckoutRooms > 0 ? totalQty / totalCheckoutRooms : null;

    const totalCostPerRoom =
        totalCheckoutRooms > 0 && Number.isFinite(totalCost)
            ? totalCost / totalCheckoutRooms
            : null;

    const hasRows = rows && rows.length > 0;
    const dateColSpan = dateHeaders.length;

    // Build colgroup widths (print-stable)
    const colStyles: React.CSSProperties[] = [
        { width: `${itemW}px` },
        ...dateHeaders.map(() => ({ width: `${dateW}px` })),
        { width: `${totalW}px` },
        ...(showRatio ? [{ width: `${ratioW}px` }] : []),
        { width: `${totalW}px` },
    ];

    return (
        <div className={`stage ${dense ? "dense" : ""}`}>
            <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

            {/* TOP RAIL */}
            <section className="topRail">
                <div className="topRailInner">
                    <div>
                        <div className="brandLine">
                            <div className="titleStack">
                                <h1 className="h1">
                                    <Icon name="doc" size={16} color={UI.ink} />
                                    <span>Laundry Monthly Detail Sheet</span>
                                </h1>
                                <p className="sub monoSmall">
                                    Dates → columns • Items → rows • Missing = <span className="dotMark">···</span> • Zero ={" "}
                                    <span className="zeroMark">0</span>
                                </p>
                            </div>

                            <div style={{ textAlign: "right", minWidth: 0 }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                    <Icon name="cal" size={14} color={UI.ink2} />
                                    <div style={{ fontSize: 10.6, fontWeight: 950, color: UI.ink2 }}>
                                        {monthLong(month)}
                                    </div>
                                </div>
                                <div style={{ marginTop: 2, fontSize: 8.2, color: UI.faint }} className="monoSmall">
                                    Generated • {generatedAt}
                                </div>
                            </div>
                        </div>

                        <div className="legendRow">
                            <span className="pillLegend">
                                <Icon name="bld" size={12} color={UI.ink2} />
                                Property: <strong style={{ color: UI.ink2 }}>{safeText(propertyName)}</strong>
                            </span>
                            <span className="pillLegend">
                                <Icon name="home" size={12} color={UI.ink2} />
                                Vendor: <strong style={{ color: UI.ink2 }}>{safeText(vendorName)}</strong>
                            </span>
                            <span className="pillLegend">
                                <Icon name="tag" size={12} color={UI.ink2} />
                                Type: <strong style={{ color: UI.ink2 }}>{transactionLabel(transactionType)}</strong>
                            </span>
                            <span className="pillLegend">
                                <Icon name="info" size={12} color={UI.ink2} />
                                Tip: weekend columns are lightly washed for fast scanning
                            </span>
                        </div>

                        <hr className="hrDash" />
                    </div>

                    <aside className="summaryBox">
                        <div className="summaryGrid">
                            <div className="kv">
                                <Icon name="sum" size={14} color={UI.ink2} />
                                <div className="kvLabel">TOTAL QTY</div>
                                <div className="kvValue monoSmall">{String(totalQty)}</div>
                            </div>

                            <div className="kv">
                                <Icon name="sum" size={14} color={UI.ink2} />
                                <div className="kvLabel">TOTAL COST</div>
                                <div className="kvValue monoSmall">{moneyINR(totalCost)}</div>
                            </div>

                            {showRatio && (
                                <>
                                    <div className="kv">
                                        <Icon name="room" size={14} color={UI.ink2} />
                                        <div className="kvLabel">CHECKOUT ROOMS</div>
                                        <div className="kvValue monoSmall">{String(totalCheckoutRooms)}</div>
                                    </div>

                                    <div className="kv">
                                        <Icon name="tag" size={14} color={UI.ink2} />
                                        <div className="kvLabel">OVERALL / ROOM</div>
                                        <div className="kvValue monoSmall">
                                            {overallRatio != null ? overallRatio.toFixed(2) : "—"}
                                        </div>
                                    </div>

                                    <div className="kv">
                                        <Icon name="sum" size={14} color={UI.ink2} />
                                        <div className="kvLabel">TOTAL COST PER ROOM</div>
                                        <div className="kvValue monoSmall">
                                            {totalCostPerRoom != null ? moneyINR(totalCostPerRoom) : "—"}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </aside>
                </div>
            </section>

            {/* TABLE */}
            <section className="sheet">
                <table>
                    <colgroup>
                        {colStyles.map((s, i) => (
                            <col key={i} style={s} />
                        ))}
                    </colgroup>

                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", paddingLeft: 10 }}>ITEM</th>

                            {dateHeaders.map((dateKey) => {
                                const wknd = weekendByDate[dateKey];
                                return (
                                    <th key={dateKey} className={wknd ? "wknd" : ""} title={dateKey}>
                                        <div className="thDate">
                                            <div className="thDow">{dow2(dateKey)}</div>
                                            <div className="thDay monoSmall">{dd(dateKey)}</div>
                                        </div>
                                    </th>
                                );
                            })}

                            <th className="anchorL" style={{ textAlign: "right", paddingRight: 10 }}>
                                TOTAL QTY
                            </th>

                            {showRatio && (
                                <th style={{ textAlign: "right", paddingRight: 10 }} className="anchorR">
                                    RATIO
                                </th>
                            )}

                            <th style={{ textAlign: "right", paddingRight: 10 }}>TOTAL COST</th>
                        </tr>
                    </thead>

                    <tbody>
                        {!hasRows ? (
                            <tr>
                                <td
                                    colSpan={3 + dateColSpan + (showRatio ? 2 : 1)}
                                    style={{ padding: 18, textAlign: "center" }}
                                >
                                    <div style={{ fontSize: 12, fontWeight: 950, color: UI.ink2 }}>
                                        No rows to display
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 9, color: UI.muted }}>
                                        This report has an empty dataset for the selected month.
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => {
                                const rowCost = getRowTotalCost(row);

                                const rowTotalRatio =
                                    showRatio && totalCheckoutRooms > 0
                                        ? (row.total || 0) / totalCheckoutRooms
                                        : null;

                                return (
                                    <tr key={row.linenItemId}>
                                        <td className="item">
                                            <span className="itemName">{safeText(row.linenItemName, "—")}</span>
                                            <span className="itemMeta monoSmall">
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                    <Icon name="tag" size={12} color={UI.ink2} />
                                                    Unit:{" "}
                                                    <strong>{row.unitPrice != null ? moneyINR(row.unitPrice) : "—"}</strong>
                                                </span>
                                                {/* <span style={{ marginLeft: "auto", color: UI.faint }}>
                                                    ID: {safeText(row.linenItemId, "—")}
                                                </span> */}
                                            </span>
                                        </td>

                                        {dateHeaders.map((dateKey) => {
                                            const wknd = weekendByDate[dateKey];
                                            const dayHasData = dateHasData[dateKey];
                                            const state = getCellState(row.dates, dateKey);

                                            // When all laundry-item data for this day is 0/missing, show — and no heat
                                            const label = !dayHasData
                                                ? "—"
                                                : state.kind === "missing"
                                                    ? "···"
                                                    : state.kind === "zero"
                                                        ? "0"
                                                        : String(state.qty);

                                            let heatClass = "";
                                            if (dayHasData && state.kind === "value") {
                                                const shade = heatFor(state.qty, maxQty);
                                                heatClass =
                                                    shade === UI.heat1
                                                        ? "heat1"
                                                        : shade === UI.heat2
                                                            ? "heat2"
                                                            : shade === UI.heat3
                                                                ? "heat3"
                                                                : "heat4";
                                            }

                                            return (
                                                <td key={dateKey} className={`cell ${wknd ? "wknd" : ""}`}>
                                                    <span
                                                        className={[
                                                            "badge",
                                                            !dayHasData ? "missing" : state.kind === "missing" ? "missing" : "",
                                                            dayHasData && state.kind === "zero" ? "zero" : "",
                                                            heatClass,
                                                        ].join(" ")}
                                                    >
                                                        {label}
                                                    </span>
                                                </td>
                                            );
                                        })}

                                        <td className="tot anchorL">
                                            <span className="totBox">
                                                <span className="totVal monoSmall">{String(row.total ?? 0)}</span>
                                                <span className="totHint">qty</span>
                                            </span>
                                        </td>

                                        {showRatio && (
                                            <td className="tot anchorR">
                                                <span className="totBox">
                                                    <span className="totVal monoSmall">
                                                        {rowTotalRatio != null ? rowTotalRatio.toFixed(2) : "—"}
                                                    </span>
                                                    <span className="totHint">/ room</span>
                                                </span>
                                            </td>
                                        )}

                                        <td className="tot">
                                            <span className="totBox">
                                                <span className="totVal monoSmall">
                                                    {rowCost != null ? moneyINR(rowCost) : "—"}
                                                </span>
                                                <span className="totHint">cost</span>
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>

                    {hasRows && (
                        <tfoot>
                            <tr>
                                <td colSpan={1 + dateColSpan} className="grand">
                                    GRAND TOTAL
                                </td>
                                <td className="monoSmall" style={{ textAlign: "right" }}>
                                    {String(totalQty)}
                                </td>
                                {showRatio && (
                                    <td className="monoSmall" style={{ textAlign: "right" }}>
                                        {overallRatio != null ? overallRatio.toFixed(2) : "—"}
                                    </td>
                                )}
                                <td className="monoSmall" style={{ textAlign: "right" }}>
                                    {moneyINR(totalCost)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </section>

            {/* BOTTOM RAIL */}
            <section className="bottomRail">
                <div className="signRow">
                    <SignBlock title="Authorized Signatory" hint="Name / Signature" icon="tag" />
                    <SignBlock title="Verified On" hint="Date" icon="cal" />
                </div>

                {barcodeData ? <BarcodeBlock data={barcodeData} /> : null}

                <div className="brandStamp monoSmall">
                    <div style={{ fontWeight: 950, color: UI.ink2 }}>ZenVana • Laundry Ledger</div>
                    <div>{monthShort(month)} • Monochrome print</div>
                </div>
            </section>
        </div>
    );
}

// ---------------- Signature block ----------------
function SignBlock({
    title,
    hint,
    icon,
    imageSrc,
}: {
    title: string;
    hint: string;
    icon: keyof typeof ICONS;
    imageSrc?: string;
}) {
    return (
        <div className="sign">
            <div className="signTitle">
                <Icon name={icon} size={13} color={UI.ink2} />
                <span>{title}</span>
            </div>

            {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageSrc}
                    alt=""
                    style={{
                        marginTop: 7,
                        height: 26,
                        maxWidth: "100%",
                        objectFit: "contain",
                        display: "block",
                    }}
                />
            ) : (
                <div className="signLine" />
            )}

            <div className="signHint">{hint}</div>
        </div>
    );
}

// ---------------- Barcode block ----------------
function BarcodeBlock({ data }: { data: string }) {
    const bars = barcodeToBars(data);
    const barW = 2;
    const barGap = 1;
    const height = 26;

    const positions: { x: number; w: number }[] = [];
    let x = 0;
    for (const w of bars) {
        positions.push({ x, w: w * barW });
        x += w * barW + barGap;
    }
    const width = Math.max(12, x - barGap);

    const label = data.length > 28 ? `${data.slice(0, 28)}…` : data;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
                {positions.map(({ x: px, w: bw }, i) => (
                    <rect key={i} x={px} y={0} width={bw} height={height} fill={UI.ink2} />
                ))}
            </svg>
            <div style={{ fontSize: 7.4, color: UI.muted, letterSpacing: 0.25 }} className="monoSmall">
                {label}
            </div>
        </div>
    );
}
