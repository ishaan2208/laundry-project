import type { Engine, Ctx } from "./engine";

export const almanacCss = `
.sheet[data-design="almanac"]{
  font-family: var(--sans);
  color:#161616;
}
.sheet[data-design="almanac"] .al-mast{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  padding-bottom:9px;
  border-bottom:2.4px solid #161616;
}
.sheet[data-design="almanac"] .al-kicker{
  font-size:8.2px;
  letter-spacing:.34em;
  text-transform:uppercase;
  color:#6d6d6d;
  font-weight:600;
  margin-bottom:5px;
}
.sheet[data-design="almanac"] .al-mast h1{
  margin:0;
  font-size:23px;
  font-weight:600;
  letter-spacing:-.012em;
  line-height:1;
}
.sheet[data-design="almanac"] .al-mast h1 .al-mo{
  font-weight:400;
  color:#3a3a3a;
}
.sheet[data-design="almanac"] .al-mast-r{
  text-align:right;
  display:grid;
  grid-template-columns:auto auto;
  gap:2px 16px;
  align-items:baseline;
  margin:0;
}
.sheet[data-design="almanac"] .al-mast-r dt{
  font-size:8px;
  letter-spacing:.22em;
  text-transform:uppercase;
  color:#9a9a9a;
  text-align:right;
  font-weight:600;
}
.sheet[data-design="almanac"] .al-mast-r dd{
  margin:0;
  font-size:11px;
  color:#161616;
  text-align:right;
  font-weight:500;
  letter-spacing:.01em;
}
.sheet[data-design="almanac"] .al-mast-r dd b{ font-weight:600; }

.sheet[data-design="almanac"] .al-caption{
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  margin-top:7px;
  font-size:9px;
  color:#6d6d6d;
  letter-spacing:.02em;
}
.sheet[data-design="almanac"] .al-caption .al-dir{
  font-weight:600;
  color:#3a3a3a;
  letter-spacing:.12em;
  text-transform:uppercase;
  font-size:8.4px;
}
.sheet[data-design="almanac"] .al-caption .al-reading em{ font-style:normal; color:#161616; font-weight:600; }

.sheet[data-design="almanac"] .al-rail{
  display:grid;
  grid-template-columns:repeat(5,1fr);
  margin:11px 0 0;
  border-top:.6px solid #c9c9c9;
  border-bottom:.6px solid #c9c9c9;
}
.sheet[data-design="almanac"] .al-rail .al-cell{
  padding:8px 14px 9px 0;
}
.sheet[data-design="almanac"] .al-rail .al-cell + .al-cell{
  padding-left:16px;
  border-left:.6px solid #e2e2e2;
}
.sheet[data-design="almanac"] .al-rail .al-lab{
  font-size:7.6px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color:#9a9a9a;
  font-weight:600;
}
.sheet[data-design="almanac"] .al-rail .al-val{
  margin-top:4px;
  font-size:19px;
  font-weight:600;
  letter-spacing:-.01em;
  line-height:1;
  font-variant-numeric:tabular-nums;
}
.sheet[data-design="almanac"] .al-rail .al-val .al-u{
  font-size:10px;
  font-weight:500;
  color:#6d6d6d;
  letter-spacing:0;
}

/* ============ STRIP-PLOT SMALL-MULTIPLES FIGURE ============ */
.sheet[data-design="almanac"] .al-grid-wrap{ margin-top:14px; }

/* figure header row */
.sheet[data-design="almanac"] .al-fig-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  padding-bottom:4px;
  border-bottom:1.4px solid #161616;
}
.sheet[data-design="almanac"] .al-fig-head .al-fig-ttl{
  font-size:8.4px;
  letter-spacing:.13em;
  text-transform:uppercase;
  color:#3a3a3a;
  font-weight:600;
}
.sheet[data-design="almanac"] .al-fig-head .al-fig-note{
  font-size:8.4px;
  color:#6d6d6d;
  letter-spacing:.01em;
}
.sheet[data-design="almanac"] .al-fig-head .al-fig-note em{ font-style:normal; color:#161616; font-weight:600; }

/* week-band strip under the figure header */
.sheet[data-design="almanac"] .al-fig-weekband{
  display:flex;
  align-items:stretch;
  border-bottom:.6px solid #e2e2e2;
}
.sheet[data-design="almanac"] .al-fig-weekband .al-wb-gutter{
  flex:0 0 var(--al-label-w, 132px);
}
.sheet[data-design="almanac"] .al-fig-weekband .al-wb-plot{
  flex:1 1 auto;
  display:flex;
  min-width:0;
}
.sheet[data-design="almanac"] .al-fig-weekband .al-wb-recap{
  flex:0 0 var(--al-recap-w, 130px);
}
.sheet[data-design="almanac"] .al-fig-weekband .al-wb-seg{
  text-align:center;
  font-size:7px;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:#9a9a9a;
  font-weight:600;
  padding:0 0 2px;
  border-left:.6px solid #ececec;
}
.sheet[data-design="almanac"] .al-fig-weekband .al-wb-seg:first-child{ border-left:none; }

/* the small-multiples rows */
.sheet[data-design="almanac"] .al-strips{ margin-top:0; }
.sheet[data-design="almanac"] .al-strip{
  display:flex;
  align-items:stretch;
  border-bottom:.6px solid #e2e2e2;
  height:30px;
}
.sheet[data-design="almanac"] .al-strip:last-child{ border-bottom:none; }

/* left label block */
.sheet[data-design="almanac"] .al-strip .al-lbl{
  flex:0 0 var(--al-label-w, 132px);
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding-right:10px;
  line-height:1.1;
}
.sheet[data-design="almanac"] .al-strip .al-lbl .al-nm{
  font-size:9.8px;
  font-weight:600;
  letter-spacing:-.005em;
  color:#161616;
}
.sheet[data-design="almanac"] .al-strip .al-lbl .al-pr{
  font-size:7.6px;
  color:#6d6d6d;
  font-weight:500;
  letter-spacing:.02em;
  margin-top:1px;
}

/* the plot band */
.sheet[data-design="almanac"] .al-strip .al-plot{
  flex:1 1 auto;
  position:relative;
  min-width:0;
  display:flex;
  align-items:flex-end;
  border-left:.6px solid #d6d6d6;
}
/* baseline hairline */
.sheet[data-design="almanac"] .al-strip .al-plot::after{
  content:"";
  position:absolute;
  left:0; right:0; bottom:5px;
  height:.6px;
  background:#d0d0d0;
}
/* per-day slot */
.sheet[data-design="almanac"] .al-slot{
  flex:1 1 0;
  min-width:0;
  height:100%;
  position:relative;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  padding-bottom:5px; /* sit on baseline */
  box-sizing:border-box;
}
/* week-boundary gridline */
.sheet[data-design="almanac"] .al-slot.al-wk{
  box-shadow:inset .6px 0 0 #dcdcdc;
}
/* weekend faint wash */
.sheet[data-design="almanac"] .al-slot.al-we{ background:#f6f6f6; }

/* the bar */
.sheet[data-design="almanac"] .al-slot .al-bar{
  width:64%;
  max-width:5px;
  background:#4d4d4d;
  min-height:1.2px;
}
.sheet[data-design="almanac"] .al-slot .al-bar.al-peak{ background:#161616; }
/* dispatched-but-zero: a tiny stub on the baseline */
.sheet[data-design="almanac"] .al-slot .al-bar.al-z{
  height:1.2px !important;
  background:#c4c4c4;
}

/* top day-of-month tick band */
.sheet[data-design="almanac"] .al-fig-ticks{
  display:flex;
  align-items:stretch;
}
.sheet[data-design="almanac"] .al-fig-ticks .al-tk-gutter{ flex:0 0 var(--al-label-w, 132px); }
.sheet[data-design="almanac"] .al-fig-ticks .al-tk-plot{
  flex:1 1 auto;
  display:flex;
  min-width:0;
  border-left:.6px solid transparent;
}
.sheet[data-design="almanac"] .al-fig-ticks .al-tk-recap{ flex:0 0 var(--al-recap-w, 130px); }
.sheet[data-design="almanac"] .al-fig-ticks .al-tk{
  flex:1 1 0;
  min-width:0;
  text-align:center;
  font-size:5.6px;
  line-height:1;
  color:#bcbcbc;
  font-weight:500;
  font-variant-numeric:tabular-nums;
  padding-bottom:2px;
}
.sheet[data-design="almanac"] .al-fig-ticks .al-tk.al-tk-wk{ color:#7a7a7a; font-weight:600; }

/* right recap block */
.sheet[data-design="almanac"] .al-strip .al-recap{
  flex:0 0 var(--al-recap-w, 130px);
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:0;
  border-left:1.4px solid #161616;
  font-variant-numeric:tabular-nums;
}
.sheet[data-design="almanac"] .al-recap .al-rc{
  text-align:right;
  padding:0 0 0 10px;
  box-sizing:border-box;
}
.sheet[data-design="almanac"] .al-recap .al-rc.al-rc-tot{ flex:0 0 42px; }
.sheet[data-design="almanac"] .al-recap .al-rc.al-rc-room{ flex:0 0 38px; color:#3a3a3a; }
.sheet[data-design="almanac"] .al-recap .al-rc.al-rc-cost{ flex:0 0 52px; }
.sheet[data-design="almanac"] .al-recap .al-rc .al-v{ font-size:10px; }
.sheet[data-design="almanac"] .al-recap .al-rc.al-rc-tot .al-v{ font-weight:700; font-size:10.4px; }
.sheet[data-design="almanac"] .al-recap .al-rc.al-rc-room .al-v{ font-weight:500; font-size:9.4px; }
.sheet[data-design="almanac"] .al-recap .al-rc.al-rc-cost .al-v{ font-weight:600; font-size:10px; }
.sheet[data-design="almanac"] .al-recap .al-rc .al-rs{ color:#6d6d6d; font-weight:500; font-size:8px; }

/* recap header labels */
.sheet[data-design="almanac"] .al-fig-weekband .al-wb-recap{
  display:flex;
  align-items:flex-end;
  justify-content:flex-end;
}
.sheet[data-design="almanac"] .al-wb-recap .al-rc-h{
  text-align:right;
  padding:0 0 2px 10px;
  box-sizing:border-box;
  font-size:7.6px;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:#3a3a3a;
  font-weight:600;
}
.sheet[data-design="almanac"] .al-wb-recap .al-rc-h.al-rc-tot{ flex:0 0 42px; }
.sheet[data-design="almanac"] .al-wb-recap .al-rc-h.al-rc-room{ flex:0 0 38px; }
.sheet[data-design="almanac"] .al-wb-recap .al-rc-h.al-rc-cost{ flex:0 0 52px; }

/* grand-total row */
.sheet[data-design="almanac"] .al-grand{
  display:flex;
  align-items:stretch;
  border-top:2px solid #161616;
  height:26px;
}
.sheet[data-design="almanac"] .al-grand .al-g-lbl{
  flex:0 0 var(--al-label-w, 132px);
  display:flex;
  align-items:center;
  font-size:8.6px;
  letter-spacing:.12em;
  text-transform:uppercase;
  font-weight:700;
  color:#161616;
}
.sheet[data-design="almanac"] .al-grand .al-g-plot{
  flex:1 1 auto;
  min-width:0;
  display:flex;
  align-items:center;
  padding-left:8px;
  font-size:8.2px;
  color:#6d6d6d;
  letter-spacing:.01em;
}
.sheet[data-design="almanac"] .al-grand .al-g-plot em{ font-style:normal; color:#161616; font-weight:600; }
.sheet[data-design="almanac"] .al-grand .al-g-recap{
  flex:0 0 var(--al-recap-w, 130px);
  display:flex;
  align-items:center;
  justify-content:flex-end;
  border-left:1.4px solid #161616;
  font-variant-numeric:tabular-nums;
}
.sheet[data-design="almanac"] .al-g-recap .al-rc{
  text-align:right;
  padding:0 0 0 10px;
  box-sizing:border-box;
}
.sheet[data-design="almanac"] .al-g-recap .al-rc.al-rc-tot{ flex:0 0 42px; }
.sheet[data-design="almanac"] .al-g-recap .al-rc.al-rc-room{ flex:0 0 38px; }
.sheet[data-design="almanac"] .al-g-recap .al-rc.al-rc-cost{ flex:0 0 52px; }
.sheet[data-design="almanac"] .al-g-recap .al-rc .al-v{ font-size:11px; font-weight:700; }
.sheet[data-design="almanac"] .al-g-recap .al-rc.al-rc-room .al-v{ font-size:9.6px; }
.sheet[data-design="almanac"] .al-g-recap .al-rc .al-rs{ color:#6d6d6d; font-weight:600; font-size:8.4px; }

.sheet[data-design="almanac"] .al-footer{
  margin-top:20px;
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  padding-top:11px;
  border-top:.6px solid #c9c9c9;
}
.sheet[data-design="almanac"] .al-sig{ display:flex; gap:40px; }
.sheet[data-design="almanac"] .al-sig .al-slot{ min-width:180px; }
.sheet[data-design="almanac"] .al-sig .al-line{
  height:26px;
  border-bottom:1px solid #161616;
  margin-bottom:5px;
}
.sheet[data-design="almanac"] .al-sig .al-role{
  font-size:8px;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:#6d6d6d;
  font-weight:600;
}
.sheet[data-design="almanac"] .al-sig .al-who{
  font-size:9.4px;
  color:#161616;
  font-weight:500;
  margin-top:1px;
}
.sheet[data-design="almanac"] .al-brandline{
  text-align:right;
  font-size:8px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color:#9a9a9a;
  font-weight:600;
  line-height:1.5;
}
.sheet[data-design="almanac"] .al-brandline .al-disc{
  display:block;
  letter-spacing:.02em;
  text-transform:none;
  font-size:8px;
  color:#6d6d6d;
  font-weight:500;
  margin-top:3px;
  max-width:230px;
  margin-left:auto;
}
`;

export function renderAlmanac(engine: Engine, C: Ctx): string {
    const {
        PROPERTY, VENDOR, MONTH, GEN, ROOMS, DAYS, rows, dayTot, gQty, gCost, nDisp, dom, domPct, weeks,
        wend, disp, weekOf, isWkStart, inr, money, cfg,
    } = engine;

    const rupee = "₹";
    const dirLine = C.dirWord;
    const capDir = C.disp ? "Reconciliation · Dispatch Ledger" : "Reconciliation · Receipt Ledger";

    const wkSum = new Array(weeks.length).fill(0);
    for (let d = 0; d < DAYS; d++) wkSum[weekOf(d)] += dayTot[d];
    let peakW = 0;
    for (let w = 1; w < wkSum.length; w++) {
        if (wkSum[w] > wkSum[peakW]) peakW = w;
    }
    const reading = "Busiest week <em>W" + (peakW + 1) + "</em> (" + inr(wkSum[peakW]) + " pcs) · Dominant item <em>" + dom.name + "</em> (" + domPct + "% of volume)";

    let html = "";
    html += '<header class="al-mast">';
    html += '<div class="al-mast-l">';
    html += '<div class="al-kicker">Monthly Laundry Detail Sheet</div>';
    html += "<h1>" + PROPERTY + ' <span class="al-mo">· ' + MONTH + "</span></h1>";
    html += "</div>";
    html += '<dl class="al-mast-r">';
    html += "<dt>Vendor</dt><dd><b>" + VENDOR + "</b></dd>";
    html += "<dt>Direction</dt><dd>" + dirLine + "</dd>";
    html += "<dt>Generated</dt><dd>" + GEN + "</dd>";
    html += "</dl>";
    html += "</header>";

    html += '<div class="al-caption">';
    html += '<span class="al-dir">' + capDir + "</span>";
    html += '<span class="al-reading">' + reading + "</span>";
    html += "</div>";

    type RailCell = { lab: string; val: string };
    const railCells: RailCell[] = [{ lab: "Total Pieces", val: inr(gQty) }];
    if (cfg.cost) railCells.push({ lab: "Total Cost", val: money(gCost) });
    if (C.disp) {
        railCells.push({ lab: "Checkout Rooms", val: inr(ROOMS) });
        railCells.push({ lab: "Pieces / Room", val: (gQty / ROOMS).toFixed(2) });
        if (cfg.cost) railCells.push({ lab: "Cost / Room", val: rupee + (gCost / ROOMS).toFixed(2) });
    } else {
        railCells.push({ lab: "Receipt Days", val: inr(nDisp) });
    }
    html += '<dl class="al-rail">';
    html += railCells
        .map((c) => '<div class="al-cell"><div class="al-lab">' + c.lab + '</div><div class="al-val">' + c.val + "</div></div>")
        .join("");
    html += "</dl>";

    const showRoom = !!C.room;
    const showCost = !!cfg.cost;

    const recapW = 42 + (showRoom ? 38 : 0) + (showCost ? 52 : 0) + 10;
    const figVars = 'style="--al-recap-w:' + recapW + 'px"';

    const figNote = "Busiest week <em>W" + (peakW + 1) + "</em> · Dominant item <em>" + dom.name + "</em> (" + domPct + "%)";
    const figTtl = C.disp
        ? "Fig. · Daily dispatch by item — one bar per pickup day"
        : "Fig. · Daily receipt by item — one bar per receipt day";

    html += '<div class="al-grid-wrap" ' + figVars + ">";

    html += '<div class="al-fig-head">';
    html += '<span class="al-fig-ttl">' + figTtl + "</span>";
    html += '<span class="al-fig-note">' + figNote + "</span>";
    html += "</div>";

    html += '<div class="al-fig-ticks">';
    html += '<div class="al-tk-gutter"></div>';
    html += '<div class="al-tk-plot">';
    for (let ti = 0; ti < DAYS; ti++) {
        const wkTk = isWkStart(ti);
        html += '<div class="al-tk' + (wkTk ? " al-tk-wk" : "") + '">' + (ti + 1) + "</div>";
    }
    html += "</div>";
    html += '<div class="al-tk-recap"></div>';
    html += "</div>";

    html += '<div class="al-fig-weekband">';
    html += '<div class="al-wb-gutter"></div>';
    html += '<div class="al-wb-plot">';
    weeks.forEach((wk, wi) => {
        const span = wk.end - wk.start + 1;
        const pct = (span / DAYS) * 100;
        html += '<div class="al-wb-seg" style="flex:0 0 ' + pct.toFixed(4) + '%">W' + (wi + 1) + "</div>";
    });
    html += "</div>";
    html += '<div class="al-wb-recap">';
    html += '<div class="al-rc-h al-rc-tot">Pcs</div>';
    if (showRoom) html += '<div class="al-rc-h al-rc-room">/Rm</div>';
    if (showCost) html += '<div class="al-rc-h al-rc-cost">Cost</div>';
    html += "</div>";
    html += "</div>";

    html += '<div class="al-strips">';
    rows.forEach((it) => {
        const mx = it.max || 1;
        html += '<div class="al-strip">';

        html += '<div class="al-lbl"><span class="al-nm">' + it.name + "</span>";
        if (showCost) html += '<span class="al-pr">' + rupee + it.price + " / pc</span>";
        html += "</div>";

        html += '<div class="al-plot">';
        for (let si = 0; si < DAYS; si++) {
            let cls = "al-slot";
            if (isWkStart(si)) cls += " al-wk";
            if (cfg.weekend && wend(si)) cls += " al-we";
            html += '<div class="' + cls + '">';
            if (disp(si)) {
                const q = it.daily[si];
                if (q === 0) {
                    html += '<div class="al-bar al-z"></div>';
                } else {
                    const h = Math.max(2, Math.round((q / mx) * 20));
                    const peak = q === it.max ? " al-peak" : "";
                    html += '<div class="al-bar' + peak + '" style="height:' + h + 'px"></div>';
                }
            }
            html += "</div>";
        }
        html += "</div>"; // /al-plot

        html += '<div class="al-recap">';
        html += '<div class="al-rc al-rc-tot"><span class="al-v">' + inr(it.total) + "</span></div>";
        if (showRoom) html += '<div class="al-rc al-rc-room"><span class="al-v">' + (it.total / ROOMS).toFixed(2) + "</span></div>";
        if (showCost) html += '<div class="al-rc al-rc-cost"><span class="al-v"><span class="al-rs">' + rupee + "</span>" + inr(it.cost) + "</span></div>";
        html += "</div>";

        html += "</div>"; // /al-strip
    });
    html += "</div>"; // /al-strips

    html += '<div class="al-grand">';
    html += '<div class="al-g-lbl">Grand Total</div>';
    html += '<div class="al-g-plot">Across ' + nDisp + " " + (C.disp ? "dispatch" : "receipt") + " days · peak day " + inr(Math.max(...dayTot)) + " pcs</div>";
    html += '<div class="al-g-recap">';
    html += '<div class="al-rc al-rc-tot"><span class="al-v">' + inr(gQty) + "</span></div>";
    if (showRoom) html += '<div class="al-rc al-rc-room"><span class="al-v">' + (gQty / ROOMS).toFixed(2) + "</span></div>";
    if (showCost) html += '<div class="al-rc al-rc-cost"><span class="al-v"><span class="al-rs">' + rupee + "</span>" + inr(gCost) + "</span></div>";
    html += "</div>";
    html += "</div>";

    html += "</div>"; // /al-grid-wrap

    if (cfg.xcheck) {
        let colSum = 0;
        for (let xi = 0; xi < DAYS; xi++) colSum += dayTot[xi];
        html += '<div class="al-caption" style="margin-top:9px">';
        html += '<span class="al-reading">Column totals sum to <em>' + inr(colSum) + "</em> pcs across " + nDisp + " " + (C.disp ? "dispatch" : "receipt") + " days — ledger balances.</span>";
        html += "</div>";
    }

    if (cfg.sign) {
        html += '<footer class="al-footer">';
        html += '<div class="al-sig">';
        html += '<div class="al-slot"><div class="al-line"></div><div class="al-role">Authorised Signatory</div><div class="al-who">' + PROPERTY + "</div></div>";
        html += '<div class="al-slot"><div class="al-line"></div><div class="al-role">Verified On</div><div class="al-who">' + GEN.split(",")[0] + "</div></div>";
        html += "</div>";
        html += '<div class="al-brandline">' + PROPERTY + " · Laundry Ledger · " + MONTH;
        html += '<span class="al-disc">Figures reconcile hotel-side ' + (C.disp ? "dispatch" : "receipt") + " records against vendor challans for the stated month.</span>";
        html += "</div>";
        html += "</footer>";
    }

    return html;
}
