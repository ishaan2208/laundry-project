/**
 * Shared data engine for the 4 laundry detail-sheet designs.
 * Converts the real CalendarReportPDFProps (Prisma-sourced) into the flat
 * shape every design's render() function expects — mirrors the day-index /
 * weeks / dow-disp-wend helpers the designs were prototyped against.
 */
import { format, parse, isValid, isWeekend, getDay } from "date-fns";
import type { CalendarReportPDFProps } from "../CalendarReportHTML";

export type EngineRow = {
    name: string;
    price: number;
    daily: number[];
    total: number;
    cost: number;
    max: number;
};

export type Week = { start: number; end: number; d: number };

export type Engine = {
    PROPERTY: string;
    VENDOR: string;
    MONTH: string;
    MABBR: string;
    GEN: string;
    ROOMS: number;
    DAYS: number;
    DOW: string[];
    scheduleLabel: string;
    rows: EngineRow[];
    dayTot: number[];
    gQty: number;
    gCost: number;
    nDisp: number;
    dom: EngineRow;
    domPct: number;
    weeks: Week[];
    ROMAN: string[];
    dow: (i: number) => number;
    wend: (i: number) => boolean;
    disp: (i: number) => boolean;
    weekOf: (i: number) => number;
    isWkStart: (i: number) => boolean;
    inr: (n: number) => string;
    money: (n: number) => string;
    cfg: {
        cost: boolean;
        room: boolean;
        spark: boolean;
        xcheck: boolean;
        legend: boolean;
        weekend: boolean;
        sign: boolean;
    };
};

export type Ctx = {
    disp: boolean;
    room: boolean;
    dirWord: string;
    verb: string;
};

export function esc(v: unknown): string {
    return String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function safeParse(dateKey: string) {
    const d = parse(dateKey, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : null;
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

export function buildEngine(props: CalendarReportPDFProps): { engine: Engine; ctx: Ctx } {
    const { propertyName, vendorName, month, transactionType, dateHeaders, rows, checkoutRoomsByDate } = props;
    const DAYS = dateHeaders.length;
    const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const dowByIdx = dateHeaders.map((dk) => {
        const d = safeParse(dk);
        return d ? getDay(d) : 0;
    });
    const wendByIdx = dateHeaders.map((dk) => {
        const d = safeParse(dk);
        return d ? isWeekend(d) : false;
    });
    const DOW_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const hasCost = rows.some((r) => r.unitPrice != null);

    const engineRows: EngineRow[] = rows.map((r) => {
        const daily = dateHeaders.map((dk) => r.dates?.[dk] ?? 0);
        const total = typeof r.total === "number" && Number.isFinite(r.total) ? r.total : daily.reduce((a, b) => a + b, 0);
        const cost =
            r.totalCost != null && Number.isFinite(r.totalCost)
                ? r.totalCost
                : r.unitPrice != null
                    ? total * r.unitPrice
                    : 0;
        return {
            name: esc(r.linenItemName),
            price: r.unitPrice ?? 0,
            daily,
            total,
            cost,
            max: daily.length ? Math.max(...daily) : 0,
        };
    });

    const dayTot = dateHeaders.map((_, i) => engineRows.reduce((s, r) => s + r.daily[i], 0));
    const gQty = engineRows.reduce((s, r) => s + r.total, 0);
    const gCost = engineRows.reduce((s, r) => s + r.cost, 0);
    const dispFlags = dayTot.map((t) => t > 0);
    const nDisp = dispFlags.filter(Boolean).length;

    const dom =
        engineRows.slice().sort((a, b) => b.total - a.total)[0] ??
        ({ name: "—", price: 0, daily: [], total: 0, cost: 0, max: 0 } as EngineRow);
    const domPct = gQty > 0 ? Math.round((dom.total / gQty) * 100) : 0;

    function dow(i: number) {
        return dowByIdx[i] ?? 0;
    }
    function wend(i: number) {
        return wendByIdx[i] ?? false;
    }
    function disp(i: number) {
        return dispFlags[i] ?? false;
    }
    function weekOf(i: number) {
        const mo = (dow(i) + 6) % 7;
        return Math.floor((i - mo + 7) / 7);
    }
    function isWkStart(i: number) {
        return i > 0 && weekOf(i) !== weekOf(i - 1);
    }

    const weeks: Week[] = [];
    const seen = new Map<number, Week>();
    for (let i = 0; i < DAYS; i++) {
        const w = weekOf(i);
        let g = seen.get(w);
        if (!g) {
            g = { start: i, end: i, d: 0 };
            seen.set(w, g);
            weeks.push(g);
        }
        g.end = i;
        g.d += 1;
    }

    const dispatchWeekdaySet = new Set<number>();
    for (let i = 0; i < DAYS; i++) {
        if (dispFlags[i]) dispatchWeekdaySet.add(dowByIdx[i]);
    }
    const dispatchWeekdays = Array.from(dispatchWeekdaySet)
        .sort((a, b) => a - b)
        .map((d) => DOW_FULL[d]);
    const scheduleLabel = dispatchWeekdays.length > 0 && dispatchWeekdays.length <= 4
        ? dispatchWeekdays.join(" · ")
        : "Varies";

    const dispatchMode = transactionType === "DISPATCH_TO_LAUNDRY";
    const totalCheckoutRooms =
        dispatchMode && checkoutRoomsByDate
            ? dateHeaders.reduce((s, dk) => s + (checkoutRoomsByDate[dk] ?? 0), 0)
            : 0;

    const inr = (n: number) => Math.round(n).toLocaleString("en-IN");
    const money = (n: number) => `&#8377;${inr(n)}`;

    const cfg = {
        cost: hasCost,
        room: dispatchMode && totalCheckoutRooms > 0,
        spark: true,
        xcheck: true,
        legend: true,
        weekend: true,
        sign: true,
    };

    const monthLabel = monthLong(month);
    const engine: Engine = {
        PROPERTY: esc(propertyName),
        VENDOR: esc(vendorName),
        MONTH: monthLabel,
        MABBR: monthLabel.slice(0, 3),
        GEN: format(new Date(), "d MMM yyyy, h:mm a"),
        ROOMS: totalCheckoutRooms,
        DAYS,
        DOW,
        scheduleLabel,
        rows: engineRows,
        dayTot,
        gQty,
        gCost,
        nDisp,
        dom,
        domPct,
        weeks,
        ROMAN: ["I", "II", "III", "IV", "V", "VI"],
        dow,
        wend,
        disp,
        weekOf,
        isWkStart,
        inr,
        money,
        cfg,
    };

    const ctx: Ctx = {
        disp: dispatchMode,
        room: cfg.room,
        dirWord: dispatchMode ? "Dispatched to laundry" : "Received from laundry",
        verb: dispatchMode ? "dispatched to" : "received from",
    };

    return { engine, ctx };
}
