import type { Engine, Ctx } from "./engine";

export const atlasCss = `
.sheet[data-design="atlas"]{
  position:relative;display:flex;flex-direction:column;
  font-family:var(--sans);
  color:var(--ink);
  -webkit-font-smoothing:antialiased;
}
.sheet[data-design="atlas"] .at-mono{ font-variant-numeric:tabular-nums; }
.sheet[data-design="atlas"] .at-smallcaps{ font-variant:small-caps; letter-spacing:.14em; text-transform:lowercase; }
.sheet[data-design="atlas"] .at-sc-tight{ font-variant:small-caps; letter-spacing:.08em; text-transform:lowercase; }
.sheet[data-design="atlas"] .at-sc{ font-variant:small-caps; letter-spacing:.1em; font-size:1.05em; }

/* ================= MASTHEAD ================= */
.sheet[data-design="atlas"] .at-masthead{
  display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:6px;
}
.sheet[data-design="atlas"] .at-mast-left{ max-width:60%; }
.sheet[data-design="atlas"] .at-mast-eyebrow{
  font-size:8.5px; letter-spacing:.42em; text-transform:uppercase;
  color:var(--faint); font-weight:600; margin-bottom:5px;
  display:flex; align-items:center; gap:10px;
}
.sheet[data-design="atlas"] .at-tick{
  flex:0 0 26px; height:1px; background:var(--ink); display:inline-block;
}
.sheet[data-design="atlas"] .at-mast-title{
  font-family:var(--serif); font-size:25px; line-height:.98; letter-spacing:.005em;
  font-weight:400; color:var(--ink);
}
.sheet[data-design="atlas"] .at-mast-sub{
  margin-top:5px; font-size:10.5px; color:var(--ink-soft); letter-spacing:.02em;
  font-family:var(--serif); font-style:italic;
}
.sheet[data-design="atlas"] .at-mast-right{ text-align:right; flex:0 0 auto; padding-bottom:2px; }
.sheet[data-design="atlas"] .at-meta-grid{
  display:grid; grid-template-columns:auto auto; gap:2px 20px; font-size:9.5px; text-align:right;
}
.sheet[data-design="atlas"] .at-meta-grid dt{
  font-size:7.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--faint);
  align-self:center; font-weight:600;
}
.sheet[data-design="atlas"] .at-meta-grid dd{
  font-family:var(--serif); font-size:11px; color:var(--ink); letter-spacing:.01em; padding-bottom:2px;
  margin:0;
}
.sheet[data-design="atlas"] .at-mast-underline{ position:relative; margin-top:3px; }
.sheet[data-design="atlas"] .at-mast-underline::before{ content:""; display:block; height:2px; background:var(--rule); }
.sheet[data-design="atlas"] .at-mast-underline::after{ content:""; display:block; height:1px; background:var(--ink); margin-top:1.5px; }

/* ================= STAT RAIL ================= */
.sheet[data-design="atlas"] .at-rail{
  display:grid; grid-template-columns:repeat(5,1fr);
  margin-top:4px; border-top:1px solid var(--ink); border-bottom:1px solid var(--ink);
}
.sheet[data-design="atlas"] .at-rail-cell{ padding:4px 14px 5px; position:relative; }
.sheet[data-design="atlas"] .at-rail-cell + .at-rail-cell::before{
  content:""; position:absolute; left:0; top:9px; bottom:9px; width:1px; background:var(--hair);
}
.sheet[data-design="atlas"] .at-rail-cell.at-lead{ background:var(--wash); }
.sheet[data-design="atlas"] .at-rail-k{
  font-size:7.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--faint);
  font-weight:600; margin-bottom:5px;
}
.sheet[data-design="atlas"] .at-rail-v{
  font-family:var(--serif); font-size:18px; line-height:1; font-weight:400;
  font-variant-numeric:tabular-nums; color:var(--ink);
}
.sheet[data-design="atlas"] .at-rail-v .at-unit{ font-size:12px; color:var(--ink-soft); margin-right:1px; }

/* ================= EPHEMERIS — weekly leaves ================= */
.sheet[data-design="atlas"] .at-ephem{ margin-top:5px; flex:1; }
.sheet[data-design="atlas"] .at-ephem-band{
  display:grid; grid-template-columns:repeat(3,1fr); gap:0 12px;
}
.sheet[data-design="atlas"] .at-ephem-band + .at-ephem-band{ margin-top:3px; }

.sheet[data-design="atlas"] .at-leaf{ min-width:0; }
.sheet[data-design="atlas"] .at-leaf-head{
  display:flex; justify-content:space-between; align-items:baseline;
  padding-bottom:2px; border-bottom:1.4px solid var(--ink);
}
.sheet[data-design="atlas"] .at-leaf-num{
  font-family:var(--serif); font-size:11.5px; letter-spacing:.01em; color:var(--ink); font-weight:400;
}
.sheet[data-design="atlas"] .at-leaf-num .at-rn{
  font-variant:small-caps; letter-spacing:.06em; font-weight:600; margin-left:2px;
}
.sheet[data-design="atlas"] .at-leaf-span{
  font-size:7.6px; letter-spacing:.1em; text-transform:uppercase; color:var(--faint); font-weight:600;
}

/* weekly item x day grid */
.sheet[data-design="atlas"] table.at-wk{
  width:100%; border-collapse:collapse; table-layout:fixed; font-variant-numeric:tabular-nums; margin-top:2px;
}
.sheet[data-design="atlas"] .at-wk col.at-wc-item{ width:56px; }
.sheet[data-design="atlas"] .at-wk col.at-wc-day{ width:auto; }
.sheet[data-design="atlas"] .at-wk col.at-wc-tot{ width:26px; }

.sheet[data-design="atlas"] .at-wk thead th{ font-weight:600; vertical-align:bottom; padding:0; }
.sheet[data-design="atlas"] .at-wk-ith{
  text-align:left; font-size:6.4px; letter-spacing:.1em; text-transform:uppercase; color:var(--faint);
}
.sheet[data-design="atlas"] .at-wk-dow{
  font-size:6px; letter-spacing:.04em; text-transform:uppercase; color:var(--faint);
  font-weight:600; text-align:center;
}
.sheet[data-design="atlas"] .at-wk-dnum{
  font-size:8px; color:var(--ink-soft); font-weight:500; text-align:center; padding-bottom:2px !important;
}
.sheet[data-design="atlas"] .at-wk-toth{
  font-size:6.4px; letter-spacing:.08em; text-transform:uppercase; color:var(--faint); font-weight:600; text-align:right;
}
.sheet[data-design="atlas"] th.at-wknd, .sheet[data-design="atlas"] td.at-wknd{ background:var(--wash-2); }
.sheet[data-design="atlas"] th.at-wk-dow.at-wknd{ color:#9a9a9a; }
.sheet[data-design="atlas"] .at-wk-headrule th{ border-bottom:1.1px solid var(--ink); padding:0; height:0; }

.sheet[data-design="atlas"] .at-wk tbody td{
  padding:0.5px 0; text-align:center; height:10.5px; font-size:7.6px; color:var(--ink-soft);
  border-bottom:1px solid var(--hair); position:relative;
}
.sheet[data-design="atlas"] .at-wk-item{
  text-align:left; padding-left:1px; font-size:7.6px; color:var(--ink); font-weight:500;
  letter-spacing:.005em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  border-bottom:1px solid var(--hair);
}
.sheet[data-design="atlas"] .at-wk-q{ font-variant-numeric:tabular-nums; }
.sheet[data-design="atlas"] .at-wk-q .at-n{ font-size:8px; position:relative; z-index:1; }
.sheet[data-design="atlas"] .at-wk-q.at-blank{ color:var(--hair); }
.sheet[data-design="atlas"] .at-wk-q.at-blank .at-dot{ color:var(--faint-2); font-size:7.5px; }
.sheet[data-design="atlas"] .at-wk-wt{
  border-left:1px solid var(--hair); font-size:8px; font-weight:600; color:var(--ink); text-align:right; padding-right:1px !important;
}

/* week column-total sub-row */
.sheet[data-design="atlas"] .at-wk-sub td{
  border-top:1px solid var(--ink); border-bottom:none; padding-top:3px; font-weight:600;
}
.sheet[data-design="atlas"] .at-wk-sub .at-wk-item{
  font-size:6.4px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-mute); border-bottom:none;
}
.sheet[data-design="atlas"] .at-wk-sub .at-wk-q{ color:var(--ink); font-weight:600; }
.sheet[data-design="atlas"] .at-wk-sub .at-wk-wt{ font-family:var(--serif); font-size:9px; }

/* ================= MONTH TOTALS SUMMARY ================= */
.sheet[data-design="atlas"] .at-summary{ margin-top:4px; }
.sheet[data-design="atlas"] .at-summary-cap{
  display:flex; align-items:center; gap:8px;
  font-size:7.5px; letter-spacing:.24em; text-transform:uppercase; color:var(--faint);
  font-weight:600; margin-bottom:4px;
}
.sheet[data-design="atlas"] .at-summary-cap .at-tick{ flex:0 0 16px; }

.sheet[data-design="atlas"] table.at-totals{
  width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums;
  border-top:1.4px solid var(--ink); border-bottom:1px solid var(--ink);
}
.sheet[data-design="atlas"] .at-totals col.at-tc-item{ width:auto; }
.sheet[data-design="atlas"] .at-totals thead th{
  font-size:7px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint);
  font-weight:600; padding:4px 8px; text-align:right; border-bottom:1px solid var(--hair);
}
.sheet[data-design="atlas"] .at-tt-item{ text-align:left !important; }
.sheet[data-design="atlas"] .at-tt-num{ text-align:right; }
.sheet[data-design="atlas"] .at-totals tbody td{
  padding:2.5px 8px; font-size:9px; color:var(--ink-soft); border-bottom:1px solid var(--hair);
}
.sheet[data-design="atlas"] .at-totals tbody td.at-tt-item{
  color:var(--ink); font-weight:500; display:flex; justify-content:space-between; align-items:baseline; gap:8px;
}
.sheet[data-design="atlas"] .at-tt-price{
  font-size:7.4px; color:var(--faint); font-weight:500; letter-spacing:.03em; white-space:nowrap;
}
.sheet[data-design="atlas"] .at-tt-pcs{ text-align:right; font-weight:600; color:var(--ink); }
.sheet[data-design="atlas"] .at-totals tbody td:not(.at-tt-item){ text-align:right; }
.sheet[data-design="atlas"] .at-tt-cost{ text-align:right; font-weight:500; color:var(--ink); }
.sheet[data-design="atlas"] .at-cur{ color:var(--faint); font-size:8px; margin-right:1px; }
.sheet[data-design="atlas"] .at-tt-grand td{
  border-top:1.4px solid var(--ink); border-bottom:none; padding-top:5px; font-weight:700;
}
.sheet[data-design="atlas"] .at-tt-grand .at-tt-item{ font-family:var(--serif); font-size:10px; color:var(--ink); }
.sheet[data-design="atlas"] .at-tt-grand .at-tt-pcs{ font-family:var(--serif); font-size:11px; }
.sheet[data-design="atlas"] .at-tt-grand .at-tt-cost{ font-family:var(--serif); font-size:11px; }

/* ================= LEGEND + FOOTER ================= */
.sheet[data-design="atlas"] .at-subfoot{
  display:flex; justify-content:space-between; align-items:flex-start;
  margin-top:5px; padding-top:5px; border-top:1px solid var(--ink); gap:24px;
}
.sheet[data-design="atlas"] .at-legend{ font-size:8px; color:var(--faint); letter-spacing:.02em; max-width:70%; }
.sheet[data-design="atlas"] .at-legend-title{
  font-size:7.5px; letter-spacing:.22em; text-transform:uppercase; font-weight:600;
  color:var(--ink-soft); margin-bottom:6px;
}
.sheet[data-design="atlas"] .at-legend p{ line-height:1.2; font-size:7.2px; margin:0; }
.sheet[data-design="atlas"] .at-keyrow{ display:flex; gap:16px; margin-top:2px; }
.sheet[data-design="atlas"] .at-keyrow span{ display:flex; align-items:center; gap:5px; }
.sheet[data-design="atlas"] .at-chip{ display:inline-block; width:12px; height:9px; border:1px solid var(--hair); }
.sheet[data-design="atlas"] .at-chip.at-wknd-chip{ background:var(--wash-2); }
.sheet[data-design="atlas"] .at-chip.at-dash{ background:none; border:none; color:var(--faint-2); font-size:9px; width:auto; height:auto; }

.sheet[data-design="atlas"] .at-sign{ display:flex; gap:44px; align-items:flex-end; flex:0 0 auto; }
.sheet[data-design="atlas"] .at-sign-field{ min-width:150px; }
.sheet[data-design="atlas"] .at-sign-line{ height:1px; background:var(--ink); margin-bottom:5px; }
.sheet[data-design="atlas"] .at-sign-fill{
  font-family:var(--serif); font-size:12px; color:var(--ink); padding-bottom:2px; min-height:13px; letter-spacing:.01em;
}
.sheet[data-design="atlas"] .at-sign-k{
  font-size:7.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--faint); font-weight:600;
}

/* ================= COLOPHON ================= */
.sheet[data-design="atlas"] .at-colophon{
  margin-top:1px; display:flex; justify-content:space-between; align-items:center;
  font-size:7.5px; color:var(--faint); letter-spacing:.1em;
  border-top:1px solid var(--hair); padding-top:1px;
}
.sheet[data-design="atlas"] .at-brand{
  font-family:var(--serif); font-style:italic; letter-spacing:.03em; font-size:9px; color:var(--ink-soft);
}
.sheet[data-design="atlas"] .at-brand .at-bdot{ margin:0 6px; color:var(--faint-2); }
.sheet[data-design="atlas"] .at-folio{ font-variant-numeric:tabular-nums; letter-spacing:.14em; }
`;

function shortName(n: string): string {
    const parts = String(n).split(" ");
    return parts.length > 2 ? parts.slice(0, 2).join(" ") : n;
}

export function renderAtlas(engine: Engine, C: Ctx): string {
    const {
        PROPERTY, VENDOR, MONTH, MABBR, GEN, ROOMS, rows, dayTot, gQty, gCost, nDisp, dom, weeks, ROMAN,
        dow, wend, disp, inr, money, cfg, scheduleLabel,
    } = engine;

    const DOWL = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    let html = "";
    html += '<header class="at-masthead">';
    html += '<div class="at-mast-left">';
    html += '<div class="at-mast-eyebrow"><span class="at-tick"></span>Linen Reconciliation Ledger</div>';
    html += '<div class="at-mast-title">Monthly Laundry Detail</div>';
    html += '<div class="at-mast-sub">' + C.dirWord + " · a day-by-day verification of every piece " + (C.disp ? "sent out" : "brought back") + "</div>";
    html += "</div>";
    html += '<div class="at-mast-right">';
    html += '<dl class="at-meta-grid">';
    html += "<dt>Property</dt><dd>" + PROPERTY + "</dd>";
    html += "<dt>Vendor</dt><dd>" + VENDOR + "</dd>";
    html += "<dt>Period</dt><dd>" + MONTH + "</dd>";
    html += '<dt>Generated</dt><dd class="at-mono">' + GEN + "</dd>";
    html += "</dl>";
    html += "</div>";
    html += "</header>";
    html += '<div class="at-mast-underline"></div>';

    // ---- STAT RAIL ----
    type RailCell = { k: string; v: string; lead?: boolean };
    let rail: RailCell[] = [{ k: "Total Pieces", v: inr(gQty), lead: true }];
    if (cfg.cost) rail.push({ k: "Total Cost", v: '<span class="at-unit">₹</span>' + inr(gCost) });
    if (C.disp) rail.push({ k: "Checkout Rooms", v: inr(ROOMS) });
    if (C.disp && C.room) rail.push({ k: "Pieces / Room", v: (gQty / ROOMS).toFixed(2) });
    else rail.push({ k: C.disp ? "Dispatch Days" : "Receipt Days", v: inr(nDisp) });
    if (cfg.cost) {
        if (C.disp) rail.push({ k: "Cost / Room", v: '<span class="at-unit">₹</span>' + (gCost / ROOMS).toFixed(2) });
        else rail.push({ k: "Avg / Piece", v: '<span class="at-unit">₹</span>' + (gCost / gQty).toFixed(2) });
    } else {
        rail.push({ k: "Dominant Item", v: dom.name });
    }
    rail = rail.slice(0, 5);
    html += '<section class="at-rail">';
    html += rail
        .map(
            (c) =>
                '<div class="at-rail-cell' + (c.lead ? " at-lead" : "") + '">' +
                '<div class="at-rail-k">' + c.k + "</div>" +
                '<div class="at-rail-v">' + c.v + "</div>" +
                "</div>"
        )
        .join("");
    html += "</section>";

    // ============================================================
    // EPHEMERIS — stacked weekly leaves (Week I..N, N = weeks.length)
    // ============================================================
    function leaf(k: number): string {
        const w = weeks[k];
        const d0 = w.start;
        const dn = w.d;
        const spanTxt = d0 + 1 + "–" + (w.end + 1) + " " + MABBR;

        let lh = "";
        lh += '<div class="at-leaf">';
        lh += '<div class="at-leaf-head">';
        lh += '<span class="at-leaf-num">Week <span class="at-rn">' + ROMAN[k] + "</span></span>";
        lh += '<span class="at-leaf-span">' + spanTxt + "</span>";
        lh += "</div>";

        lh += '<table class="at-wk"><colgroup>';
        lh += '<col class="at-wc-item">';
        for (let c = 0; c < dn; c++) lh += '<col class="at-wc-day">';
        lh += '<col class="at-wc-tot">';
        lh += "</colgroup>";

        lh += "<thead>";
        lh += '<tr><th class="at-wk-ith">Item</th>';
        for (let a = 0; a < dn; a++) {
            const di = d0 + a;
            let cls = "at-wk-dow";
            if (cfg.weekend && wend(di)) cls += " at-wknd";
            lh += '<th class="' + cls + '">' + DOWL[dow(di)] + "</th>";
        }
        lh += '<th class="at-wk-toth">Wk</th></tr>';

        lh += '<tr><th class="at-wk-ith"></th>';
        for (let b = 0; b < dn; b++) {
            const di2 = d0 + b;
            let cls2 = "at-wk-dnum";
            if (cfg.weekend && wend(di2)) cls2 += " at-wknd";
            lh += '<th class="' + cls2 + '">' + (di2 + 1) + "</th>";
        }
        lh += '<th class="at-wk-toth"></th></tr>';
        lh += '<tr class="at-wk-headrule"><th colspan="' + (dn + 2) + '"></th></tr>';
        lh += "</thead>";

        lh += "<tbody>";
        rows.forEach((it) => {
            let wkSum = 0;
            lh += "<tr>";
            lh += '<td class="at-wk-item" title="' + it.name + '">' + shortName(it.name) + "</td>";
            for (let e = 0; e < dn; e++) {
                const di3 = d0 + e;
                const q = it.daily[di3];
                const isWknd = cfg.weekend && wend(di3);
                let cls3 = "at-wk-q";
                if (isWknd) cls3 += " at-wknd";
                if (!disp(di3) || q === 0) {
                    cls3 += " at-blank";
                    lh += '<td class="' + cls3 + '"><span class="at-dot">·</span></td>';
                } else {
                    wkSum += q;
                    lh += '<td class="' + cls3 + '"><span class="at-n">' + q + "</span></td>";
                }
            }
            lh += '<td class="at-wk-wt">' + (wkSum > 0 ? inr(wkSum) : '<span style="color:#cfcfcf">·</span>') + "</td>";
            lh += "</tr>";
        });

        let wkGrand = 0;
        lh += '<tr class="at-wk-sub">';
        lh += '<td class="at-wk-item">Total</td>';
        for (let f = 0; f < dn; f++) {
            const di4 = d0 + f;
            const ct = dayTot[di4];
            const isWknd4 = cfg.weekend && wend(di4);
            let cls4 = "at-wk-q";
            if (isWknd4) cls4 += " at-wknd";
            if (disp(di4) && ct > 0) {
                wkGrand += ct;
                lh += '<td class="' + cls4 + '">' + ct + "</td>";
            } else {
                lh += '<td class="' + cls4 + ' at-blank"><span class="at-dot">·</span></td>';
            }
        }
        lh += '<td class="at-wk-wt">' + (wkGrand > 0 ? inr(wkGrand) : '<span style="color:#cfcfcf">·</span>') + "</td>";
        lh += "</tr>";

        lh += "</tbody></table></div>";
        return lh;
    }

    // three leaves per band, last band padded to keep the 3-col grid aligned
    const leaves = weeks.map((_, k) => leaf(k));
    const bands: string[] = [];
    for (let i = 0; i < leaves.length; i += 3) {
        const chunk = leaves.slice(i, i + 3);
        while (chunk.length < 3) chunk.push("<div></div>");
        bands.push('<div class="at-ephem-band">' + chunk.join("") + "</div>");
    }
    html += '<div class="at-ephem">' + bands.join("") + "</div>";

    // ---- compact month TOTALS summary ----
    html += '<div class="at-summary">';
    html += '<div class="at-summary-cap"><span class="at-tick"></span>Month totals by item</div>';
    html += '<table class="at-totals"><colgroup><col class="at-tc-item">';
    html += "<col><col>";
    if (cfg.cost) html += "<col>";
    html += "</colgroup>";
    html += "<thead><tr>";
    html += '<th class="at-tt-item">Linen item</th>';
    html += '<th class="at-tt-num">Total pcs</th>';
    html += '<th class="at-tt-num">' + (C.disp && C.room ? "/ Room" : "Share") + "</th>";
    if (cfg.cost) html += '<th class="at-tt-num">Cost</th>';
    html += "</tr></thead>";
    html += "<tbody>";
    rows.forEach((it) => {
        html += "<tr>";
        html += '<td class="at-tt-item">' + it.name + (cfg.cost ? '<span class="at-tt-price">₹' + it.price + "/pc</span>" : "") + "</td>";
        html += '<td class="at-tt-pcs">' + inr(it.total) + "</td>";
        if (C.disp && C.room) html += "<td>" + (it.total / ROOMS).toFixed(2) + "</td>";
        else html += "<td>" + (gQty > 0 ? Math.round((it.total / gQty) * 100) : 0) + "%</td>";
        if (cfg.cost) html += '<td class="at-tt-cost"><span class="at-cur">₹</span>' + inr(it.cost) + "</td>";
        html += "</tr>";
    });
    html += '<tr class="at-tt-grand">';
    html += '<td class="at-tt-item"><span class="at-sc">Grand total</span></td>';
    html += '<td class="at-tt-pcs">' + inr(gQty) + "</td>";
    if (C.disp && C.room) html += "<td>" + (gQty / ROOMS).toFixed(2) + "</td>";
    else html += "<td>100%</td>";
    if (cfg.cost) html += '<td class="at-tt-cost">' + money(gCost) + "</td>";
    html += "</tr>";
    html += "</tbody></table></div>";
    html += "</div>";

    // ---- SUBFOOT: legend + signature ----
    html += '<section class="at-subfoot">';
    if (cfg.legend) {
        html += '<div class="at-legend">';
        html += '<div class="at-legend-title">How to read this sheet</div>';
        html += "<p>Five weekly leaves (Week I–" + ROMAN[weeks.length - 1] + "); each column is one calendar day, each row an item. <em>Wk</em> tallies the week, the foot row totals each day. Weekend columns carry a faint shade. " + C.dirWord + " runs <b>" + scheduleLabel + "</b> — a dash marks no " + (C.disp ? "dispatch" : "receipt") + " that day.</p>";
        html += '<div class="at-keyrow">';
        if (cfg.weekend) html += '<span><i class="at-chip at-wknd-chip"></i> weekend</span>';
        html += '<span><i class="at-chip at-dash">·</i> no ' + (C.disp ? "dispatch" : "receipt") + "</span>";
        html += "</div>";
        html += "</div>";
    } else {
        html += '<div class="at-legend"></div>';
    }
    if (cfg.sign) {
        html += '<div class="at-sign">';
        html += '<div class="at-sign-field">';
        html += '<div class="at-sign-fill">&nbsp;</div>';
        html += '<div class="at-sign-line"></div>';
        html += '<div class="at-sign-k">Authorised Signatory</div>';
        html += "</div>";
        html += '<div class="at-sign-field">';
        html += '<div class="at-sign-fill">' + GEN.split(",")[0] + "</div>";
        html += '<div class="at-sign-line"></div>';
        html += '<div class="at-sign-k">Verified On</div>';
        html += "</div>";
        html += "</div>";
    }
    html += "</section>";

    // ---- COLOPHON ----
    html += '<footer class="at-colophon">';
    html += '<span class="at-brand">' + PROPERTY + ' <span class="at-bdot">·</span> Laundry Ledger <span class="at-bdot">·</span> ' + MONTH + "</span>";
    html += '<span class="at-folio">Sheet 1 of 1</span>';
    html += "</footer>";

    return html;
}
