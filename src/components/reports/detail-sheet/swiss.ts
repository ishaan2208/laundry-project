import type { Engine, Ctx } from "./engine";

export const swissCss = `
.sheet[data-design="swiss"]{
  padding:15mm 14mm 12mm 14mm;
  color:#0a0a0a;
  font-family:"Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, ui-sans-serif, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}

/* ---------- MASTHEAD ---------- */
.sheet[data-design="swiss"] .sw-mast{
  display:grid;
  grid-template-columns:1fr auto;
  align-items:end;
  border-top:2.4px solid #0a0a0a;
  padding-top:6px;
}
.sheet[data-design="swiss"] .sw-mast__left{ display:flex; flex-direction:column; gap:11px; }
.sheet[data-design="swiss"] .sw-mast__kicker{
  font-size:7.4px; letter-spacing:.30em; text-transform:uppercase;
  font-weight:700; color:#0a0a0a;
}
.sheet[data-design="swiss"] .sw-mast__title{
  font-size:23px; line-height:.96; letter-spacing:-.014em; font-weight:700; margin:0;
}
.sheet[data-design="swiss"] .sw-mast__title span{ font-weight:400; color:#555; }

.sheet[data-design="swiss"] .sw-meta{
  display:grid; grid-template-columns:repeat(2, auto); column-gap:26px; row-gap:7px; text-align:left;
}
.sheet[data-design="swiss"] .sw-meta__cell{ display:flex; flex-direction:column; gap:3px; min-width:0; }
.sheet[data-design="swiss"] .sw-meta__k{ font-size:6.7px; letter-spacing:.20em; text-transform:uppercase; font-weight:700; color:#555; }
.sheet[data-design="swiss"] .sw-meta__v{ font-size:10.5px; font-weight:600; letter-spacing:-.01em; color:#0a0a0a; white-space:nowrap; }

/* ---------- STAT RAIL ---------- */
.sheet[data-design="swiss"] .sw-rail{
  display:grid; grid-template-columns:repeat(5,1fr);
  border-top:1px solid #0a0a0a; border-bottom:1px solid #0a0a0a; margin-top:9px;
}
.sheet[data-design="swiss"] .sw-rail.sw-rail--4{ grid-template-columns:repeat(4,1fr); }
.sheet[data-design="swiss"] .sw-rail.sw-rail--3{ grid-template-columns:repeat(3,1fr); }
.sheet[data-design="swiss"] .sw-rail__cell{
  padding:9px 0 9px 10px; border-left:1px solid #c9c9c9;
  display:flex; flex-direction:column; gap:8px;
}
.sheet[data-design="swiss"] .sw-rail__cell:first-child{ border-left:0; padding-left:0; }
.sheet[data-design="swiss"] .sw-rail__k{ font-size:6.7px; letter-spacing:.20em; text-transform:uppercase; font-weight:700; color:#555; }
.sheet[data-design="swiss"] .sw-rail__v{ font-size:21px; font-weight:700; letter-spacing:-.02em; line-height:1; font-variant-numeric:tabular-nums; }
.sheet[data-design="swiss"] .sw-rail__v small{ font-size:11px; font-weight:600; color:#555; letter-spacing:0; }

/* ---------- CONTEXT LINE ---------- */
.sheet[data-design="swiss"] .sw-context{
  display:flex; justify-content:space-between; align-items:baseline; margin-top:10px; margin-bottom:4px;
}
.sheet[data-design="swiss"] .sw-context__l{ font-size:7.4px; letter-spacing:.22em; text-transform:uppercase; font-weight:700; color:#555; }
.sheet[data-design="swiss"] .sw-context__l b{ color:#0a0a0a; }
.sheet[data-design="swiss"] .sw-context__r{ font-size:7.4px; letter-spacing:.18em; text-transform:uppercase; font-weight:700; color:#555; }

/* ---------- TABLE : NEUE-GRAFIK DATA-BAR SPREAD ---------- */
.sheet[data-design="swiss"] .sw-tbl{
  width:100%; border-collapse:collapse; table-layout:fixed; font-variant-numeric:tabular-nums;
}
.sheet[data-design="swiss"] .sw-tbl col.sw-c-item{ width:118px; }
.sheet[data-design="swiss"] .sw-tbl col.sw-c-bar{ width:auto; }
.sheet[data-design="swiss"] .sw-tbl col.sw-c-room{ width:48px; }
.sheet[data-design="swiss"] .sw-tbl col.sw-c-cost{ width:56px; }

/* column header row */
.sheet[data-design="swiss"] .sw-tbl thead th{ padding:0; vertical-align:bottom; }
.sheet[data-design="swiss"] .sw-hgroup{
  font-size:6.7px; letter-spacing:.16em; text-transform:uppercase; font-weight:700;
  color:#555; text-align:left; padding:0 0 6px 0;
}
.sheet[data-design="swiss"] .sw-hgroup--r{ text-align:right; }
.sheet[data-design="swiss"] .sw-thead-rule th{ border-bottom:1.6px solid #0a0a0a; }

/* item rows — generous height, air */
.sheet[data-design="swiss"] .sw-tbl tbody td{
  padding:6px 0; border-bottom:1px solid #e2e2e2; color:#0a0a0a; vertical-align:middle;
}
.sheet[data-design="swiss"] .sw-tbl tbody tr:last-child td{ border-bottom:0; }

/* ITEM cell : name + unit price */
.sheet[data-design="swiss"] .sw-cell-item{ text-align:left; padding-right:14px; vertical-align:top; padding-top:6px; }
.sheet[data-design="swiss"] .sw-cell-item .sw-nm{ font-size:11px; font-weight:700; letter-spacing:-.01em; display:block; line-height:1.05; }
.sheet[data-design="swiss"] .sw-cell-item .sw-pr{ font-size:6.7px; font-weight:600; color:#555; letter-spacing:.06em; margin-top:4px; display:block; text-transform:uppercase; }

/* BAR cell : big magnitude bar + big total, then recessive daily strip */
.sheet[data-design="swiss"] .sw-cell-bar{ padding-right:16px; }
.sheet[data-design="swiss"] .sw-barwrap{ display:flex; align-items:center; gap:12px; }
.sheet[data-design="swiss"] .sw-bartrack{ flex:1 1 auto; height:15px; position:relative; min-width:0; }
.sheet[data-design="swiss"] .sw-bar{
  height:15px; background:#0a0a0a; display:block; min-width:2px;
}
.sheet[data-design="swiss"] .sw-bartot{
  flex:0 0 auto; font-size:20px; font-weight:700; letter-spacing:-.02em; line-height:1;
  font-variant-numeric:tabular-nums; min-width:34px; text-align:right;
}
/* recessive daily strip under the bar */
.sheet[data-design="swiss"] .sw-strip{
  display:flex; margin-top:4px; gap:0; width:100%;
}
.sheet[data-design="swiss"] .sw-strip__k{
  flex:1 1 0; text-align:center; font-size:6px; font-weight:500; color:#7a7a7a;
  line-height:1; font-variant-numeric:tabular-nums; padding:1px 0;
}
.sheet[data-design="swiss"] .sw-strip__k--wknd{ background:#f4f4f4; }
.sheet[data-design="swiss"] .sw-strip__k--zero{ color:#c4c4c4; }
.sheet[data-design="swiss"] .sw-strip__k--blank{ color:#dcdcdc; }
.sheet[data-design="swiss"] .sw-strip__k--blank::after{ content:"·"; }

/* /ROOM + COST cells */
.sheet[data-design="swiss"] .sw-cell-room{ text-align:right; padding-right:0; font-size:11px; font-weight:600; color:#555; letter-spacing:-.01em; vertical-align:top; padding-top:6px; }
.sheet[data-design="swiss"] .sw-cell-cost{ text-align:right; padding-right:0; font-size:12px; font-weight:700; letter-spacing:-.01em; vertical-align:top; padding-top:6px; }
.sheet[data-design="swiss"] .sw-cell-room.sw-pad{ padding-right:16px; }

/* GRAND TOTAL */
.sheet[data-design="swiss"] .sw-grand td{
  border-top:1.6px solid #0a0a0a; border-bottom:2.4px solid #0a0a0a; padding:7px 0;
}
.sheet[data-design="swiss"] .sw-grand .sw-cell-item{ padding-top:8px; }
.sheet[data-design="swiss"] .sw-grand .sw-cell-item .sw-nm{ font-size:8px; letter-spacing:.16em; text-transform:uppercase; font-weight:700; }
.sheet[data-design="swiss"] .sw-grand .sw-gbar-label{
  font-size:6.7px; letter-spacing:.16em; text-transform:uppercase; font-weight:700; color:#555;
}
.sheet[data-design="swiss"] .sw-grand .sw-bartot{ font-size:23px; }
.sheet[data-design="swiss"] .sw-grand .sw-cell-room{ color:#0a0a0a; font-weight:700; padding-top:8px; }
.sheet[data-design="swiss"] .sw-grand .sw-cell-cost{ font-size:13px; padding-top:8px; }
.sheet[data-design="swiss"] .sw-grand .sw-barwrap{ align-items:center; }

/* ---------- CROSS-CHECK ---------- */
.sheet[data-design="swiss"] .sw-xcheck{
  margin-top:9px; font-size:7px; letter-spacing:.14em; text-transform:uppercase; font-weight:700; color:#555;
}
.sheet[data-design="swiss"] .sw-xcheck b{ color:#0a0a0a; }

/* ---------- LEGEND ---------- */
.sheet[data-design="swiss"] .sw-legend{ display:flex; gap:16px; align-items:center; margin-top:9px; }
.sheet[data-design="swiss"] .sw-legend__item{
  display:flex; align-items:center; gap:5px; font-size:6.4px; letter-spacing:.14em;
  text-transform:uppercase; font-weight:700; color:#555;
}
.sheet[data-design="swiss"] .sw-sw{ width:9px; height:9px; border:1px solid #c9c9c9; display:inline-block; position:relative; }
.sheet[data-design="swiss"] .sw-sw--bar{ width:16px; height:9px; background:#0a0a0a; border:0; }
.sheet[data-design="swiss"] .sw-sw--wknd{ background:#f4f4f4; }
.sheet[data-design="swiss"] .sw-sw--zero{ background:#fff; }
.sheet[data-design="swiss"] .sw-sw--zero::after{ content:"0"; font-size:6px; color:#c4c4c4; display:block; text-align:center; line-height:9px; font-weight:700; }

/* ---------- FOOTER ---------- */
.sheet[data-design="swiss"] .sw-foot{
  display:grid; grid-template-columns:1fr 1fr 1fr; column-gap:26px; align-items:end; margin-top:10px;
}
.sheet[data-design="swiss"] .sw-sig{ display:flex; flex-direction:column; gap:0; }
.sheet[data-design="swiss"] .sw-sig__line{ border-top:1px solid #0a0a0a; padding-top:5px; margin-top:14px; }
.sheet[data-design="swiss"] .sw-sig__k{ font-size:6.7px; letter-spacing:.20em; text-transform:uppercase; font-weight:700; color:#555; }
.sheet[data-design="swiss"] .sw-sig__v{ font-size:9.5px; font-weight:600; margin-top:2px; }
.sheet[data-design="swiss"] .sw-foot__brand{ text-align:right; align-self:end; }
.sheet[data-design="swiss"] .sw-brandline{ font-size:6.7px; letter-spacing:.18em; text-transform:uppercase; font-weight:700; color:#555; }
`;

export function renderSwiss(engine: Engine, C: Ctx): string {
    const {
        PROPERTY, VENDOR, MONTH, GEN, ROOMS, DAYS, rows, dayTot, gQty, gCost, nDisp, dom,
        wend, disp, inr, money, cfg, scheduleLabel,
    } = engine;

    // NOTE: PROPERTY/VENDOR/MONTH/GEN/row.name are already HTML-escaped by engine.ts —
    // interpolated directly below, no re-escaping (would double-escape entities).

    const metaCells =
        '<div class="sw-meta__cell"><div class="sw-meta__k">Vendor</div><div class="sw-meta__v">' + VENDOR + "</div></div>"
        + '<div class="sw-meta__cell"><div class="sw-meta__k">Period</div><div class="sw-meta__v">' + MONTH + "</div></div>"
        + '<div class="sw-meta__cell"><div class="sw-meta__k">Direction</div><div class="sw-meta__v">' + C.dirWord + "</div></div>"
        + '<div class="sw-meta__cell"><div class="sw-meta__k">Generated</div><div class="sw-meta__v">' + GEN + "</div></div>";

    let html =
        '<header class="sw-mast">'
        + '<div class="sw-mast__left">'
        + '<div class="sw-mast__kicker">' + PROPERTY + " &nbsp;·&nbsp; Linen Reconciliation</div>"
        + '<h1 class="sw-mast__title">Monthly Laundry Detail <span>/ ' + (C.disp ? "Dispatch" : "Receipt") + " Ledger</span></h1>"
        + "</div>"
        + '<div class="sw-meta">' + metaCells + "</div>"
        + "</header>";

    // ---------- STAT RAIL ----------
    const rail: string[] = [];
    rail.push('<div class="sw-rail__cell"><div class="sw-rail__k">Total Pieces</div><div class="sw-rail__v">' + inr(gQty) + "</div></div>");
    if (cfg.cost) {
        rail.push('<div class="sw-rail__cell"><div class="sw-rail__k">Total Cost</div><div class="sw-rail__v"><small>₹</small>' + inr(gCost) + "</div></div>");
    }
    if (C.disp) {
        rail.push('<div class="sw-rail__cell"><div class="sw-rail__k">Checkout Rooms</div><div class="sw-rail__v">' + inr(ROOMS) + "</div></div>");
        if (C.room) {
            rail.push('<div class="sw-rail__cell"><div class="sw-rail__k">Pieces / Room</div><div class="sw-rail__v">' + (gQty / ROOMS).toFixed(2) + "</div></div>");
        }
        if (cfg.cost && C.room) {
            rail.push('<div class="sw-rail__cell"><div class="sw-rail__k">Cost / Room</div><div class="sw-rail__v"><small>₹</small>' + (gCost / ROOMS).toFixed(2) + "</div></div>");
        }
    } else {
        rail.push('<div class="sw-rail__cell"><div class="sw-rail__k">Receipt Days</div><div class="sw-rail__v">' + nDisp + "</div></div>");
        rail.push('<div class="sw-rail__cell"><div class="sw-rail__k">Dominant Item</div><div class="sw-rail__v" style="font-size:11px;letter-spacing:-.01em;">' + dom.name + "</div></div>");
    }
    const railMod = rail.length === 4 ? " sw-rail--4" : rail.length === 3 ? " sw-rail--3" : "";
    html += '<section class="sw-rail' + railMod + '">' + rail.join("") + "</section>";

    // ---------- CONTEXT LINE ----------
    html +=
        '<div class="sw-context">'
        + '<div class="sw-context__l">Daily ' + (C.disp ? "dispatch" : "receipt") + " detail &nbsp;·&nbsp; <b>" + scheduleLabel + "</b> schedule &nbsp;·&nbsp; " + nDisp + " " + (C.disp ? "dispatch" : "receipt") + " days</div>"
        + '<div class="sw-context__r">Bar = monthly total &nbsp;·&nbsp; strip = daily pieces' + (cfg.cost ? " &nbsp;·&nbsp; ₹ per piece as noted" : "") + "</div>"
        + "</div>";

    // ---------- TABLE : NEUE-GRAFIK DATA-BAR SPREAD ----------
    let maxTot = 0;
    for (let r = 0; r < rows.length; r++) {
        if (rows[r].total > maxTot) maxTot = rows[r].total;
    }
    if (maxTot <= 0) maxTot = 1;

    let cg = '<col class="sw-c-item"><col class="sw-c-bar">';
    if (C.room) cg += '<col class="sw-c-room">';
    if (cfg.cost) cg += '<col class="sw-c-cost">';

    const thead =
        '<thead><tr class="sw-thead-rule">'
        + '<th class="sw-hgroup">Item' + (cfg.cost ? " · ₹/pc" : "") + "</th>"
        + '<th class="sw-hgroup">' + (C.disp ? "Monthly dispatch" : "Monthly receipt") + " — magnitude &amp; daily detail</th>"
        + (C.room ? '<th class="sw-hgroup sw-hgroup--r">/Room</th>' : "")
        + (cfg.cost ? '<th class="sw-hgroup sw-hgroup--r">Cost</th>' : "")
        + "</tr></thead>";

    const buildStrip = (daily: number[]) => {
        let s = '<div class="sw-strip">';
        for (let i = 0; i < DAYS; i++) {
            const wk = cfg.weekend && wend(i);
            if (!disp(i)) {
                s += '<span class="sw-strip__k sw-strip__k--blank' + (wk ? " sw-strip__k--wknd" : "") + '"></span>';
            } else {
                const q = daily[i];
                const zc = q === 0 ? " sw-strip__k--zero" : "";
                s += '<span class="sw-strip__k' + zc + (wk ? " sw-strip__k--wknd" : "") + '">' + q + "</span>";
            }
        }
        s += "</div>";
        return s;
    };

    let body = "";
    for (let r = 0; r < rows.length; r++) {
        const it = rows[r];
        const pct = Math.max(2, Math.round((it.total / maxTot) * 100));
        const bar =
            '<div class="sw-barwrap">'
            + '<div class="sw-bartrack"><span class="sw-bar" style="width:' + pct + '%;"></span></div>'
            + '<div class="sw-bartot">' + it.total + "</div>"
            + "</div>"
            + buildStrip(it.daily);

        body += "<tr>"
            + '<td class="sw-cell-item"><span class="sw-nm">' + it.name + "</span>"
            + (cfg.cost ? '<span class="sw-pr">' + money(it.price) + " / pc</span>" : "")
            + "</td>"
            + '<td class="sw-cell-bar">' + bar + "</td>"
            + (C.room ? '<td class="sw-cell-room">' + (it.total / ROOMS).toFixed(2) + "</td>" : "")
            + (cfg.cost ? '<td class="sw-cell-cost">' + money(it.cost) + "</td>" : "")
            + "</tr>";
    }

    const gStrip: number[] = [];
    for (let i = 0; i < DAYS; i++) gStrip.push(dayTot[i]);
    const gbar =
        '<div class="sw-barwrap">'
        + '<div class="sw-bartrack"><span class="sw-bar" style="width:100%;"></span></div>'
        + '<div class="sw-bartot">' + gQty + "</div>"
        + "</div>"
        + buildStrip(gStrip);

    body += '<tr class="sw-grand">'
        + '<td class="sw-cell-item"><span class="sw-nm">Grand Total</span></td>'
        + '<td class="sw-cell-bar">' + gbar + "</td>"
        + (C.room ? '<td class="sw-cell-room">' + (gQty / ROOMS).toFixed(2) + "</td>" : "")
        + (cfg.cost ? '<td class="sw-cell-cost">' + money(gCost) + "</td>" : "")
        + "</tr>";

    html += '<table class="sw-tbl"><colgroup>' + cg + "</colgroup>" + thead + "<tbody>" + body + "</tbody></table>";

    // ---------- CROSS-CHECK ----------
    if (cfg.xcheck) {
        let sum = 0;
        for (let i = 0; i < DAYS; i++) sum += dayTot[i];
        html += '<div class="sw-xcheck">Cross-check &nbsp;·&nbsp; column totals sum to <b>' + inr(sum) + "</b> pieces &nbsp;=&nbsp; grand total <b>" + inr(gQty) + "</b> &nbsp;·&nbsp; ledger balances</div>";
    }

    // ---------- LEGEND ----------
    if (cfg.legend) {
        html += '<div class="sw-legend">';
        html += '<div class="sw-legend__item"><span class="sw-sw sw-sw--bar"></span> Bar — monthly total</div>';
        if (cfg.weekend) {
            html += '<div class="sw-legend__item"><span class="sw-sw sw-sw--wknd"></span> Weekend — no dispatch</div>';
        }
        html += '<div class="sw-legend__item"><span class="sw-sw sw-sw--zero"></span> Scheduled day, zero of item</div>'
            + '<div class="sw-legend__item">Blank · &nbsp; no scheduled dispatch</div>'
            + "</div>";
    }

    // ---------- FOOTER ----------
    if (cfg.sign) {
        html +=
            '<footer class="sw-foot">'
            + '<div class="sw-sig"><div class="sw-sig__line">'
            + '<div class="sw-sig__k">Authorised Signatory</div>'
            + '<div class="sw-sig__v">' + PROPERTY + " — Front Office / Accounts</div>"
            + "</div></div>"
            + '<div class="sw-sig"><div class="sw-sig__line">'
            + '<div class="sw-sig__k">Verified On</div>'
            + '<div class="sw-sig__v">' + GEN.split(",")[0] + "</div>"
            + "</div></div>"
            + '<div class="sw-foot__brand"><div class="sw-brandline">' + PROPERTY + " &nbsp;·&nbsp; Laundry Ledger &nbsp;·&nbsp; " + MONTH + "</div></div>"
            + "</footer>";
    }

    return html;
}
