"use client";

/**
 * CalendarReportPDF (2030 flagship — print-perfect B/W)
 * ------------------------------------------------------------------
 * Laundry Monthly Detail Sheet
 * - Dates in columns, items in rows, final columns as totals (Qty + Cost)
 * - STRICTLY black / white / grey (monochrome printer friendly)
 * - Visual hierarchy via: line weight, spacing, grayscale panels, dotted vs solid rules, typographic rhythm
 * - Missing data (key not present) renders as "···" (NOT zero)
 * - Zero values (explicit 0) render as "0"
 * - Multi-page safe: repeated header + table header + footer
 * - Skeleton-safe: every missing field gracefully renders "—" without breaking layout
 *
 * Notes:
 * - react-pdf has no blur/gradients; “premium” is achieved through disciplined layout + linework.
 * - Keep exports + basic structure stable for downstream dependencies.
 */

import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Svg,
    Path,
    Rect,
    Circle,
    Font,
    pdf,
} from "@react-pdf/renderer";
import { parse, format, isValid, isWeekend } from "date-fns";
import { TxnType } from "@prisma/client";

// Prevent react-pdf auto-hyphenation from slicing tokens/IDs
Font.registerHyphenationCallback((word) => [word]);

// ---------- Types ----------
export type CalendarReportPDFProps = {
    propertyName: string;
    vendorName: string;
    month: string; // "yyyy-MM"
    transactionType:
    | typeof TxnType.DISPATCH_TO_LAUNDRY
    | typeof TxnType.RECEIVE_FROM_LAUNDRY;
    dateHeaders: string[]; // ["yyyy-MM-dd", ...] in month
    rows: {
        linenItemId: string;
        linenItemName: string;
        dates: Record<string, number>; // missing key = missing data
        dateCosts?: Record<string, number>;
        total: number;
        totalCost?: number | null;
        unitPrice?: number | null;
    }[];
    /**
     * Optional map of checkout-room counts per day for analytics.
     * Shape: { "YYYY-MM-DD": numberOfCheckoutRooms }
     *
     * Only used when transactionType === DISPATCH_TO_LAUNDRY.
     */
    checkoutRoomsByDate?: Record<string, number>;
};

// ---------- Design Tokens (B/W only) ----------
const TOKENS = {
    // Text / ink
    black: "#000000",
    ink: "#111111",
    ink2: "#222222",
    mid: "#444444",
    muted: "#666666",
    faint: "#888888",
    ghost: "#AAAAAA",

    // Surfaces / borders
    border: "#DDDDDD",
    border2: "#C2C2C8", // kept (still grayscale)
    panel: "#F2F2F2",
    panel2: "#EFEFF2", // kept (still grayscale)
    paper: "#FFFFFF",
    rowAlt: "#F6F6F8",

    // Grey steps for “heat”
    heat0: "#FFFFFF",
    heat1: "#F2F2F2",
    heat2: "#E9E9E9",
    heat3: "#DEDEDE",
    heat4: "#D2D2D2",
} as const;

// ---------- Layout constants (deterministic) ----------
const PAGE = {
    size: "A4" as const,
    orientation: "landscape" as const,
    margin: 32, // safe print margin (28–36 range)
};

const RAIL = {
    headerH: 132,
    tableHeaderH: 34,
    footerH: 46,
    gapAfterHeader: 10,
    gapAfterTableHeader: 8,
};

// A4 landscape width in points is ~841.89
const A4_LANDSCAPE_W = 842;

// ---------- Helpers ----------
function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function safeText(v: unknown, fallback = "—") {
    if (v === null || v === undefined) return fallback;
    const s = String(v);
    return s.trim().length ? s : fallback;
}

function safeParseDate(dateKey: string) {
    const d = parse(dateKey, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : null;
}

function formatDayCompact(dateKey: string): string {
    const d = safeParseDate(dateKey);
    if (d) return format(d, "d");
    const parts = dateKey.split("-");
    return parts[2] || dateKey;
}

function formatMonth(month: string): string {
    try {
        const [y, m] = month.split("-");
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        return format(date, "MMMM yyyy");
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

function rupees(n: number) {
    const v = Number.isFinite(n) ? n : 0;
    return `₹${v.toFixed(2)}`;
}

function sumAll(rows: CalendarReportPDFProps["rows"]) {
    let totalQty = 0;
    let totalCost = 0;
    for (const r of rows) {
        totalQty += r.total || 0;
        totalCost += r.totalCost ?? 0;
    }
    return { totalQty, totalCost };
}

// Column sizing (A4 landscape points)
function computeColumnWidths(dateCount: number, showRatio: boolean) {
    // Item column intentionally NOT too wide (stable)
    const itemW = 158; // stable “narrow-ish”
    const totalW = 66; // totals need readability (₹)
    const ratioW = showRatio ? 62 : 0;

    const usable = A4_LANDSCAPE_W - PAGE.margin * 2;

    // Columns: item + dates + totals (qty + cost + optional ratio)
    const totalsBlock = totalW * 2 + ratioW;
    const remaining = usable - itemW - totalsBlock;

    // Keep date columns readable but compact
    const dateW = clamp(Math.floor(remaining / Math.max(1, dateCount)), 14, 24);

    return { itemW, dateW, totalW, ratioW };
}

type CellState =
    | { kind: "missing" }
    | { kind: "zero" }
    | { kind: "value"; qty: number };

function getCellState(
    dates: Record<string, number> | undefined,
    dateKey: string
): CellState {
    if (!dates) return { kind: "missing" };
    if (!Object.prototype.hasOwnProperty.call(dates, dateKey))
        return { kind: "missing" };

    const v = dates[dateKey];

    // Key exists:
    if (v === 0) return { kind: "zero" };
    if (v === null || v === undefined) return { kind: "zero" };
    if (typeof v !== "number" || Number.isNaN(v)) return { kind: "zero" };
    if (v === 0) return { kind: "zero" };

    return { kind: "value", qty: v };
}

function heatShadeFor(qty: number, maxQty: number) {
    if (maxQty <= 0) return TOKENS.heat0;
    const t = qty / maxQty; // 0..1
    // stepped for crisp printing
    if (t <= 0.15) return TOKENS.heat1;
    if (t <= 0.35) return TOKENS.heat2;
    if (t <= 0.6) return TOKENS.heat3;
    return TOKENS.heat4;
}

function nowStamp() {
    // deterministic formatting (not locale surprises)
    return format(new Date(), "dd MMM yyyy • HH:mm");
}

// ---------- Tiny inline icons (SVG, monochrome) ----------
function Icon({
    name,
    size = 12,
    color = TOKENS.ink2,
}: {
    name:
    | "report"
    | "calendar"
    | "building"
    | "vendor"
    | "status"
    | "totals"
    | "rooms";
    size?: number;
    color?: string;
}) {
    const common = { width: size, height: size, viewBox: "0 0 24 24" as const };
    const strokeW = 2;

    switch (name) {
        case "calendar":
            return (
                <Svg {...common}>
                    <Rect
                        x="3"
                        y="5"
                        width="18"
                        height="16"
                        rx="3"
                        ry="3"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                    <Path d="M8 3v4M16 3v4" stroke={color} strokeWidth={strokeW} />
                    <Path d="M3 9h18" stroke={color} strokeWidth={strokeW} />
                </Svg>
            );

        case "building":
            return (
                <Svg {...common}>
                    <Path
                        d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                    <Path
                        d="M8 7h3M8 11h3M8 15h3"
                        stroke={color}
                        strokeWidth={strokeW}
                    />
                    <Path
                        d="M20 21V10a2 2 0 0 0-2-2h-1"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                    <Path d="M17 14h2M17 18h2" stroke={color} strokeWidth={strokeW} />
                </Svg>
            );

        case "vendor":
            return (
                <Svg {...common}>
                    <Path
                        d="M4 10l8-6 8 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                    <Path
                        d="M9 22V14h6v8"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                </Svg>
            );

        case "status":
            return (
                <Svg {...common}>
                    <Path
                        d="M20 12a8 8 0 1 1-3-6.3"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                    <Path
                        d="M20 6v6h-6"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                </Svg>
            );

        case "totals":
            return (
                <Svg {...common}>
                    <Rect
                        x="5"
                        y="3"
                        width="14"
                        height="18"
                        rx="3"
                        ry="3"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                    <Path d="M8 7h8M8 11h8M8 15h5" stroke={color} strokeWidth={strokeW} />
                    <Path
                        d="M9 3v18"
                        stroke={color}
                        strokeWidth={strokeW}
                        opacity={0.45}
                    />
                </Svg>
            );

        case "rooms":
            return (
                <Svg {...common}>
                    <Rect
                        x="4"
                        y="7"
                        width="16"
                        height="13"
                        rx="2"
                        ry="2"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                    <Path d="M7 20v-3M17 20v-3" stroke={color} strokeWidth={strokeW} />
                    <Circle cx="9" cy="13" r="1" fill={color} />
                    <Path
                        d="M12 12h6"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                </Svg>
            );

        case "report":
        default:
            return (
                <Svg {...common}>
                    <Path
                        d="M7 3h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z"
                        stroke={color}
                        strokeWidth={strokeW}
                        fill="none"
                    />
                    <Path
                        d="M9 8h6M9 12h6"
                        stroke={color}
                        strokeWidth={strokeW}
                    />
                </Svg>
            );
    }
}

// ---------- Styles ----------
const styles = StyleSheet.create({
    page: {
        backgroundColor: TOKENS.paper,
        color: TOKENS.ink,
        fontSize: 10,
        padding: PAGE.margin,
        position: "relative",
    },

    // Reserve space for fixed rails (prevents overlap)
    flow: {
        paddingTop: RAIL.headerH + RAIL.tableHeaderH + RAIL.gapAfterHeader + RAIL.gapAfterTableHeader,
        paddingBottom: RAIL.footerH + 8,
    },

    // --- Header Rail (fixed)
    headerRail: {
        position: "absolute",
        left: PAGE.margin,
        right: PAGE.margin,
        top: PAGE.margin,
        height: RAIL.headerH,
        borderRadius: 16,
        border: `1 solid ${TOKENS.border}`,
        backgroundColor: TOKENS.panel,
        overflow: "hidden",
        padding: 12,
    },

    // Top rail accent lines (B/W “expensive”)
    headerTopLine: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 3,
        backgroundColor: TOKENS.ink,
        opacity: 0.18,
    },
    headerHairline: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 34,
        borderBottom: `1 solid ${TOKENS.border}`,
        opacity: 1,
    },

    headerRowTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },

    titleBlock: { flexDirection: "column", flexGrow: 1, minWidth: 240 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    title: { fontSize: 20, fontWeight: 700, letterSpacing: 0.2, color: TOKENS.ink },
    subtitle: { marginTop: 2, fontSize: 8.5, color: TOKENS.muted, lineHeight: 1.2 },

    // Metadata area
    metaWrap: {
        marginTop: 10,
        flexDirection: "row",
        gap: 10,
    },

    metaCard: {
        flex: 1,
        borderRadius: 14,
        border: `1 solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
        padding: 10,
    },
    metaCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
    metaCardTitle: {
        fontSize: 8.5,
        color: TOKENS.mid,
        letterSpacing: 0.9,
        fontWeight: 700,
    },

    metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    metaLabel: { fontSize: 8, color: TOKENS.faint },
    metaLeader: {
        flexGrow: 1,
        marginHorizontal: 8,
        borderBottom: `1 dotted ${TOKENS.border2}`,
    },
    metaValue: { fontSize: 9.4, color: TOKENS.ink2, fontWeight: 700, maxWidth: 260 },

    // KPI strip (right side)
    kpiWrap: {
        width: 330,
        alignItems: "flex-end",
        justifyContent: "flex-start",
    },

    kpiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "flex-end",
    },

    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 999,
        border: `1 solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
    },
    chipDashed: {
        border: `1 dashed ${TOKENS.border2}`,
    },
    chipLabel: { fontSize: 8.2, color: TOKENS.muted },
    chipValue: { fontSize: 9.2, fontWeight: 700, color: TOKENS.ink },

    // Footer rail (fixed)
    footerRail: {
        position: "absolute",
        left: PAGE.margin,
        right: PAGE.margin,
        bottom: PAGE.margin,
        height: RAIL.footerH,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingTop: 8,
    },

    footerLeft: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
    },

    signCard: {
        width: 220,
        borderRadius: 14,
        border: `1 solid ${TOKENS.border}`,
        backgroundColor: TOKENS.panel,
        padding: 8,
    },
    signTitle: { fontSize: 9, fontWeight: 700, color: TOKENS.ink2 },
    signLine: { marginTop: 18, borderBottom: `1 solid ${TOKENS.border2}` },
    signHint: { marginTop: 4, fontSize: 7.6, color: TOKENS.muted },

    footerRight: { alignItems: "flex-end" },
    footerText: { fontSize: 8.5, color: TOKENS.faint },

    // Table header (fixed)
    tableHeaderFixed: {
        position: "absolute",
        left: PAGE.margin,
        right: PAGE.margin,
        top: PAGE.margin + RAIL.headerH + RAIL.gapAfterHeader,
        height: RAIL.tableHeaderH,
        borderRadius: 12,
        border: `1 solid ${TOKENS.border}`,
        overflow: "hidden",
        backgroundColor: TOKENS.panel2,
    },

    tableHeaderRow: {
        flexDirection: "row",
        height: RAIL.tableHeaderH,
        alignItems: "center",
    },

    thCell: {
        height: "100%",
        justifyContent: "center",
        paddingHorizontal: 8,
        borderRight: `1 solid ${TOKENS.border}`,
    },
    thLeft: { alignItems: "flex-start" },
    thCenter: { alignItems: "center" },
    thRight: { alignItems: "flex-end" },

    thText: {
        fontSize: 8,
        fontWeight: 700,
        color: TOKENS.mid,
        letterSpacing: 0.9,
    },

    // Table body
    tableBody: {
        borderRadius: 16,
        border: `1 solid ${TOKENS.border}`,
        overflow: "hidden",
        backgroundColor: TOKENS.paper,
    },

    row: {
        flexDirection: "row",
        minHeight: 26,
        borderBottom: `1 solid ${TOKENS.border}`,
        alignItems: "center",
    },
    rowAlt: { backgroundColor: TOKENS.rowAlt },

    tdCell: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRight: `1 solid ${TOKENS.border}`,
        justifyContent: "center",
    },

    itemName: {
        fontSize: 9.2,
        fontWeight: 700,
        color: TOKENS.ink2,
        lineHeight: 1.15,
    },
    itemSub: {
        marginTop: 2,
        fontSize: 7.8,
        color: TOKENS.faint,
    },

    // Date cell capsule
    capsule: {
        borderRadius: 10,
        paddingVertical: 3,
        paddingHorizontal: 6,
        minWidth: 18,
        alignItems: "center",
        justifyContent: "center",
        border: `1 solid ${TOKENS.border}`,
        backgroundColor: TOKENS.paper,
    },
    capsuleMissing: {
        border: `1 dotted ${TOKENS.border2}`,
        backgroundColor: TOKENS.paper,
    },

    qtyText: { fontSize: 8.2, fontWeight: 700, color: TOKENS.ink },
    qtyZero: { color: TOKENS.muted, fontWeight: 700 },
    qtyMissing: { color: TOKENS.ghost, fontWeight: 700, letterSpacing: 1.2 },

    // Totals badge
    totalBadge: {
        borderRadius: 12,
        paddingVertical: 5,
        paddingHorizontal: 8,
        border: `1 solid ${TOKENS.border2}`,
        backgroundColor: TOKENS.paper,
        minWidth: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    totalValue: { fontSize: 8.4, fontWeight: 700, color: TOKENS.ink2 },
    totalLabel: { marginTop: 1, fontSize: 7.4, color: TOKENS.faint },

    // Total row (grand totals)
    grandRow: {
        flexDirection: "row",
        minHeight: 30,
        alignItems: "center",
        backgroundColor: TOKENS.panel,
        borderTop: `2 solid ${TOKENS.ink}`,
        borderBottom: `0 solid ${TOKENS.border}`,
    },
    grandText: { fontSize: 9, fontWeight: 700, color: TOKENS.ink },

    // Empty state
    emptyWrap: {
        padding: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyTitle: { fontSize: 12, fontWeight: 700, color: TOKENS.ink2 },
    emptySub: { marginTop: 4, fontSize: 9, color: TOKENS.muted },
});

// ---------- Small UI helpers ----------
function Chip({
    icon,
    label,
    value,
    dashed,
}: {
    icon: React.ComponentProps<typeof Icon>["name"];
    label: string;
    value: string;
    dashed?: boolean;
}) {
    return (
        <View style={[styles.chip, ...(dashed ? [styles.chipDashed] : [])]}>
            <Icon name={icon} size={12} color={TOKENS.ink2} />
            <Text style={styles.chipLabel}>
                {label}{" "}
                <Text style={styles.chipValue}>
                    {safeText(value, "—")}
                </Text>
            </Text>
        </View>
    );
}

function MetaRow({
    icon,
    label,
    value,
}: {
    icon: React.ComponentProps<typeof Icon>["name"];
    label: string;
    value: string;
}) {
    return (
        <View style={styles.metaRow}>
            <Icon name={icon} size={12} color={TOKENS.ink2} />
            <Text style={[styles.metaLabel, { marginLeft: 6 }]}>{label}</Text>
            <View style={styles.metaLeader} />
            <Text style={styles.metaValue}>{safeText(value, "—")}</Text>
        </View>
    );
}

function CornerOrnament() {
    // minimal corner arcs (print-safe): top-right
    return (
        <Svg
            width={44}
            height={44}
            viewBox="0 0 44 44"
            style={{ position: "absolute", top: 0, right: 0, opacity: 0.35 }}
        >
            <Path
                d="M44 0v44"
                stroke={TOKENS.border2}
                strokeWidth="1"
                fill="none"
            />
            <Path
                d="M0 0h44"
                stroke={TOKENS.border2}
                strokeWidth="1"
                fill="none"
            />
            <Path
                d="M44 18c-10 0-18-8-18-18"
                stroke={TOKENS.ink2}
                strokeWidth="1"
                fill="none"
            />
            <Path
                d="M44 28c-15 0-28-13-28-28"
                stroke={TOKENS.border2}
                strokeWidth="1"
                fill="none"
            />
        </Svg>
    );
}

// ---------- Header / Footer / Table pieces ----------
function HeaderRail(props: {
    propertyName: string;
    vendorName: string;
    month: string;
    transactionType: CalendarReportPDFProps["transactionType"];
    totalQty: number;
    totalCost: number;
    showRatio: boolean;
    totalCheckoutRooms: number;
    generatedAt: string;
}) {
    const dispatchMode = isDispatch(props.transactionType);

    return (
        <View style={styles.headerRail} fixed>
            <View style={styles.headerTopLine} />
            <CornerOrnament />
            <View style={styles.headerHairline} />

            <View style={styles.headerRowTop}>
                <View style={styles.titleBlock}>
                    <View style={styles.titleRow}>
                        <Icon name="report" size={14} color={TOKENS.ink} />
                        <Text style={styles.title}>Laundry Monthly Detail Sheet</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        Dates in columns • Items in rows • Missing data shows{" "}
                        <Text style={{ fontWeight: 700, color: TOKENS.ink }}>···</Text> (not zero)
                    </Text>

                    <View style={styles.metaWrap}>
                        <View style={styles.metaCard}>
                            <View style={styles.metaCardTitleRow}>
                                <Icon name="status" size={12} color={TOKENS.ink2} />
                                <Text style={styles.metaCardTitle}>REPORT METADATA</Text>
                            </View>

                            <MetaRow icon="building" label="Property" value={props.propertyName} />
                            <MetaRow icon="calendar" label="Month" value={formatMonth(props.month)} />
                            <MetaRow icon="vendor" label="Vendor" value={props.vendorName} />
                            <MetaRow
                                icon="status"
                                label="Type"
                                value={transactionLabel(props.transactionType)}
                            />
                        </View>

                        <View
                            style={[
                                styles.metaCard,
                                {
                                    border: dispatchMode
                                        ? `1 solid ${TOKENS.ink2}`
                                        : `1 dashed ${TOKENS.border2}`,
                                },
                            ]}
                        >
                            <View style={styles.metaCardTitleRow}>
                                <Icon name="totals" size={12} color={TOKENS.ink2} />
                                <Text style={styles.metaCardTitle}>NOTES</Text>
                            </View>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Generated</Text>
                                <View style={styles.metaLeader} />
                                <Text style={styles.metaValue}>{props.generatedAt}</Text>
                            </View>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Print Mode</Text>
                                <View style={styles.metaLeader} />
                                <Text style={styles.metaValue}>Monochrome (B/W)</Text>
                            </View>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Missing Cells</Text>
                                <View style={styles.metaLeader} />
                                <Text style={styles.metaValue}>Shown as ···</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.kpiWrap}>
                    <View style={styles.kpiGrid}>
                        <Chip icon="totals" label="Total Qty" value={String(props.totalQty)} />
                        <Chip icon="totals" label="Total Cost" value={rupees(props.totalCost)} />
                        {props.showRatio && (
                            <Chip
                                icon="rooms"
                                label="Checkout Rooms"
                                value={String(props.totalCheckoutRooms)}
                                dashed
                            />
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
}

function FooterRail(props: { month: string }) {
    return (
        <View style={styles.footerRail} fixed>
            <View style={styles.footerLeft}>
                <View style={styles.signCard}>
                    <Text style={styles.signTitle}>Authorized Signatory</Text>
                    <View style={styles.signLine} />
                    <Text style={styles.signHint}>Name / Signature</Text>
                </View>

                <View style={styles.signCard}>
                    <Text style={styles.signTitle}>Verified On</Text>
                    <View style={styles.signLine} />
                    <Text style={styles.signHint}>Date</Text>
                </View>
            </View>

            <View style={styles.footerRight}>
                <Text
                    style={styles.footerText}
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                />
                <Text style={[styles.footerText, { marginTop: 3 }]}>
                    ZenVana • Laundry Ledger • {formatMonth(props.month)}
                </Text>
            </View>
        </View>
    );
}

function TableHeaderRow(props: {
    dateHeaders: string[];
    itemW: number;
    dateW: number;
    totalW: number;
    ratioW: number;
    showRatio: boolean;
}) {
    return (
        <View style={styles.tableHeaderFixed} fixed>
            <View style={styles.tableHeaderRow}>
                <View
                    style={[
                        styles.thCell,
                        styles.thLeft,
                        { width: props.itemW },
                    ]}
                >
                    <Text style={styles.thText}>ITEM</Text>
                </View>

                {props.dateHeaders.map((dateKey) => {
                    const d = safeParseDate(dateKey);
                    const weekend = d ? isWeekend(d) : false;

                    return (
                        <View
                            key={dateKey}
                            style={[
                                styles.thCell,
                                styles.thCenter,
                                { width: props.dateW },
                            ]}
                        >
                            <Text style={[styles.thText, ...(weekend ? [{ color: TOKENS.ink }] : [])]}>
                                {formatDayCompact(dateKey)}
                            </Text>
                        </View>
                    );
                })}

                <View style={[styles.thCell, styles.thRight, { width: props.totalW }]}>
                    <Text style={styles.thText}>TOTAL QTY</Text>
                </View>

                {props.showRatio && (
                    <View style={[styles.thCell, styles.thRight, { width: props.ratioW }]}>
                        <Text style={styles.thText}>RATIO</Text>
                    </View>
                )}

                <View
                    style={[
                        styles.thCell,
                        styles.thRight,
                        { width: props.totalW, borderRight: "none" as any },
                    ]}
                >
                    <Text style={styles.thText}>TOTAL COST</Text>
                </View>
            </View>
        </View>
    );
}

function TableBody(props: {
    rows: CalendarReportPDFProps["rows"];
    dateHeaders: string[];
    itemW: number;
    dateW: number;
    totalW: number;
    ratioW: number;
    showRatio: boolean;
    totalCheckoutRooms: number;
    maxQty: number;
    grandTotalQty: number;
    grandTotalCost: number;
}) {
    const hasRows = props.rows && props.rows.length > 0;

    if (!hasRows) {
        return (
            <View style={styles.tableBody}>
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyTitle}>No rows to display</Text>
                    <Text style={styles.emptySub}>
                        This report has an empty dataset for the selected month.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.tableBody}>
            {props.rows.map((row, idx) => {
                const alt = idx % 2 === 1;

                const rowTotalRatio =
                    props.showRatio && props.totalCheckoutRooms > 0
                        ? (row.total || 0) / props.totalCheckoutRooms
                        : null;

                return (
                    <View
                        key={row.linenItemId}
                        style={[styles.row, ...(alt ? [styles.rowAlt] : [])]}
                        minPresenceAhead={110}
                    >
                        {/* Item */}
                        <View
                            style={[
                                styles.tdCell,
                                {
                                    width: props.itemW,
                                    alignItems: "flex-start",
                                },
                            ]}
                        >
                            <Text style={styles.itemName}>{safeText(row.linenItemName, "—")}</Text>
                            <Text style={styles.itemSub}>
                                Unit: {row.unitPrice != null ? rupees(row.unitPrice) : "—"}
                            </Text>
                        </View>

                        {/* Dates */}
                        {props.dateHeaders.map((dateKey) => {
                            const state = getCellState(row.dates, dateKey);
                            const qtyLabel =
                                state.kind === "missing" ? "···" : state.kind === "zero" ? "0" : String(state.qty);

                            const qtyForHeat = state.kind === "value" ? state.qty : 0;
                            const shade =
                                state.kind === "value" ? heatShadeFor(qtyForHeat, props.maxQty) : TOKENS.paper;

                            return (
                                <View
                                    key={dateKey}
                                    style={[
                                        styles.tdCell,
                                        {
                                            width: props.dateW,
                                            alignItems: "center",
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.capsule,
                                            { backgroundColor: shade },
                                            ...(state.kind === "missing" ? [styles.capsuleMissing] : []),
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.qtyText,
                                                ...(state.kind === "missing" ? [styles.qtyMissing] : []),
                                                ...(state.kind === "zero" ? [styles.qtyZero] : []),
                                            ]}
                                        >
                                            {qtyLabel}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}

                        {/* Total Qty */}
                        <View
                            style={[
                                styles.tdCell,
                                { width: props.totalW, alignItems: "flex-end" },
                            ]}
                        >
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalValue}>{String(row.total ?? 0)}</Text>
                                <Text style={styles.totalLabel}>qty</Text>
                            </View>
                        </View>

                        {/* Ratio */}
                        {props.showRatio && (
                            <View
                                style={[
                                    styles.tdCell,
                                    { width: props.ratioW, alignItems: "flex-end" },
                                ]}
                            >
                                <View style={styles.totalBadge}>
                                    <Text style={styles.totalValue}>
                                        {rowTotalRatio != null ? rowTotalRatio.toFixed(2) : "—"}
                                    </Text>
                                    <Text style={styles.totalLabel}>/ room</Text>
                                </View>
                            </View>
                        )}

                        {/* Total Cost */}
                        <View
                            style={[
                                styles.tdCell,
                                {
                                    width: props.totalW,
                                    borderRight: "none" as any,
                                    alignItems: "flex-end",
                                },
                            ]}
                        >
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalValue}>
                                    {row.totalCost != null ? rupees(row.totalCost) : "—"}
                                </Text>
                                <Text style={styles.totalLabel}>cost</Text>
                            </View>
                        </View>
                    </View>
                );
            })}

            {/* Grand totals row */}
            <View style={styles.grandRow} minPresenceAhead={160}>
                <View
                    style={[
                        styles.tdCell,
                        {
                            width: props.itemW + props.dateHeaders.length * props.dateW,
                            borderRight: `1 solid ${TOKENS.border}`,
                            alignItems: "flex-start",
                        },
                    ]}
                >
                    <Text style={styles.grandText}>GRAND TOTAL</Text>
                </View>

                <View
                    style={[
                        styles.tdCell,
                        { width: props.totalW, alignItems: "flex-end" },
                    ]}
                >
                    <Text style={styles.grandText}>{String(props.grandTotalQty)}</Text>
                </View>

                {props.showRatio && (
                    <View
                        style={[
                            styles.tdCell,
                            { width: props.ratioW, alignItems: "flex-end" },
                        ]}
                    >
                        <Text style={styles.grandText}>—</Text>
                    </View>
                )}

                <View
                    style={[
                        styles.tdCell,
                        {
                            width: props.totalW,
                            borderRight: "none" as any,
                            alignItems: "flex-end",
                        },
                    ]}
                >
                    <Text style={styles.grandText}>{rupees(props.grandTotalCost)}</Text>
                </View>
            </View>
        </View>
    );
}

// ---------- Default export (requested) ----------
export default function ReportPDF(props: CalendarReportPDFProps) {
    const {
        propertyName,
        vendorName,
        month,
        transactionType,
        dateHeaders,
        rows,
        checkoutRoomsByDate,
    } = props;

    const dispatchMode = isDispatch(transactionType);
    const showRatio = dispatchMode && !!checkoutRoomsByDate;

    const { itemW, dateW, totalW, ratioW } = computeColumnWidths(
        dateHeaders.length,
        showRatio
    );

    const { totalQty, totalCost } = sumAll(rows);

    // Heat shading max (value-only)
    let maxQty = 0;
    for (const r of rows || []) {
        for (const d of dateHeaders || []) {
            const st = getCellState(r?.dates, d);
            if (st.kind === "value") maxQty = Math.max(maxQty, st.qty);
        }
    }

    const generatedAt = nowStamp();

    const totalCheckoutRooms =
        showRatio && checkoutRoomsByDate
            ? (dateHeaders || []).reduce((sum, d) => sum + (checkoutRoomsByDate[d] ?? 0), 0)
            : 0;

    return (
        <Document>
            <Page
                size={PAGE.size}
                orientation={PAGE.orientation}
                style={styles.page}
                wrap
            >
                <HeaderRail
                    propertyName={safeText(propertyName)}
                    vendorName={safeText(vendorName)}
                    month={safeText(month)}
                    transactionType={transactionType}
                    totalQty={totalQty}
                    totalCost={totalCost}
                    showRatio={showRatio}
                    totalCheckoutRooms={totalCheckoutRooms}
                    generatedAt={generatedAt}
                />

                <TableHeaderRow
                    dateHeaders={dateHeaders || []}
                    itemW={itemW}
                    dateW={dateW}
                    totalW={totalW}
                    ratioW={ratioW}
                    showRatio={showRatio}
                />

                <FooterRail month={safeText(month)} />

                {/* Flow content (rows) */}
                <View style={styles.flow}>
                    <TableBody
                        rows={rows || []}
                        dateHeaders={dateHeaders || []}
                        itemW={itemW}
                        dateW={dateW}
                        totalW={totalW}
                        ratioW={ratioW}
                        showRatio={showRatio}
                        totalCheckoutRooms={totalCheckoutRooms}
                        maxQty={maxQty}
                        grandTotalQty={totalQty}
                        grandTotalCost={totalCost}
                    />
                </View>
            </Page>
        </Document>
    );
}

// ---------- Keep existing export + structure stable ----------
export function CalendarReportPDFDocument(props: CalendarReportPDFProps) {
    return <ReportPDF {...props} />;
}

// ---------- Blob + open helpers (unchanged structure) ----------
export async function generatePDFBlob(props: CalendarReportPDFProps): Promise<Blob> {
    const doc = <CalendarReportPDFDocument {...props} />;
    const asPdf = pdf(doc);
    return await asPdf.toBlob();
}

export async function openPDFInNewTab(props: CalendarReportPDFProps): Promise<void> {
    const blob = await generatePDFBlob(props);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}
