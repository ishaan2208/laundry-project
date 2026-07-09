import { registerCss, renderRegister } from "./register";
import { swissCss, renderSwiss } from "./swiss";
import { almanacCss, renderAlmanac } from "./almanac";
import { atlasCss, renderAtlas } from "./atlas";
import type { Engine, Ctx } from "./engine";

export { buildEngine } from "./engine";
export type { Engine, Ctx } from "./engine";

export type DetailSheetDesign = "register" | "swiss" | "almanac" | "atlas";

export const DETAIL_SHEET_DESIGNS: { id: DetailSheetDesign; label: string; blurb: string }[] = [
    { id: "register", label: "Register", blurb: "Reconciliation statement" },
    { id: "swiss", label: "Swiss", blurb: "Dispatch ledger" },
    { id: "almanac", label: "Almanac", blurb: "Data figure" },
    { id: "atlas", label: "Atlas", blurb: "Engraved ledger" },
];

const RENDER: Record<DetailSheetDesign, (engine: Engine, ctx: Ctx) => string> = {
    register: renderRegister,
    swiss: renderSwiss,
    almanac: renderAlmanac,
    atlas: renderAtlas,
};

const CSS: Record<DetailSheetDesign, string> = {
    register: registerCss,
    swiss: swissCss,
    almanac: almanacCss,
    atlas: atlasCss,
};

export function isDetailSheetDesign(v: unknown): v is DetailSheetDesign {
    return v === "register" || v === "swiss" || v === "almanac" || v === "atlas";
}

export function renderDetailSheet(design: DetailSheetDesign, engine: Engine, ctx: Ctx): { css: string; html: string } {
    return { css: CSS[design], html: RENDER[design](engine, ctx) };
}

/** Base tokens + print-safe sheet container shared by every design. No min-height
 * (deliberately — a min-height that rounds a nearly-full page over 210mm produces a
 * phantom blank second page in Puppeteer's page.pdf()) and no overflow:hidden (would
 * silently clip an overflowing ledger row instead of letting it paginate). */
export const DETAIL_SHEET_BASE_CSS = `
:root{
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,"Times New Roman",serif;
  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,"SF Mono","Cascadia Mono","Roboto Mono",Menlo,Consolas,monospace;
  --ink:#141414;--ink-soft:#333;--ink-mute:#5c5c5c;--faint:#8f8f8f;--faint-2:#bcbcbc;
  --rule:#c7c7c7;--hair:#e4e4e4;--wash:#f5f5f5;--wash-2:#efefef;
}
*{box-sizing:border-box}
html,body{margin:0}
body{background:#fff;font-family:var(--sans);color:var(--ink);-webkit-font-smoothing:antialiased}
.sheet{
  width:297mm;background:#fff;color:var(--ink);position:relative;
  font-size:9.4px;line-height:1.35;display:flex;flex-direction:column;padding:14mm 15mm 12mm;
}
.sheet-body{flex:1;display:flex;flex-direction:column;min-width:0}
`;
