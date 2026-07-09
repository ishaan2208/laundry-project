import type { Engine, Ctx } from "./engine";

export const registerCss = `
.sheet[data-design="register"]{
  padding:14mm 15mm 11mm;
  font-family:var(--serif);
  color:#111;
}
/* engraved outer keyline of the register — reproduced as inset borders on the wrapper */
.sheet[data-design="register"] .rg-wrap{
  position:relative;flex:1;display:flex;flex-direction:column;min-width:0;
}
.sheet[data-design="register"] .rg-key1{
  content:"";position:absolute;inset:-7mm;border:1px solid #111;pointer-events:none;
}
.sheet[data-design="register"] .rg-key2{
  content:"";position:absolute;inset:-5.9mm;border:0.5px solid #c4c4c4;pointer-events:none;
}
.sheet[data-design="register"] .rg-inner{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;min-width:0}
.sheet[data-design="register"] .rg-spacer{flex:1 1 auto;min-height:4px}

/* ================= LETTERHEAD ================= */
.sheet[data-design="register"] .rg-head{
  display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:9px;
}
.sheet[data-design="register"] .rg-brand{max-width:150mm}
.sheet[data-design="register"] .rg-estd{
  font-family:var(--sans);font-size:7.5px;letter-spacing:.42em;text-transform:uppercase;
  color:#6a6a6a;font-weight:600;margin:0 0 7px 2px;
}
.sheet[data-design="register"] .rg-property{
  font-family:var(--serif);font-size:31px;font-weight:600;letter-spacing:.005em;
  line-height:.98;margin:0;color:#111;
}
.sheet[data-design="register"] .rg-subline{
  font-family:var(--sans);font-size:8px;letter-spacing:.30em;text-transform:uppercase;
  color:#6a6a6a;font-weight:600;margin:8px 0 0 2px;
}
/* right-hand document identity block */
.sheet[data-design="register"] .rg-docid{text-align:right;min-width:64mm;padding-top:2px}
.sheet[data-design="register"] .rg-docid .rg-kicker{
  font-family:var(--sans);font-size:7.5px;letter-spacing:.40em;text-transform:uppercase;
  color:#6a6a6a;font-weight:600;
}
.sheet[data-design="register"] .rg-docid .rg-title{
  font-family:var(--serif);font-size:16px;font-weight:600;margin-top:5px;color:#111;
  font-variant:small-caps;letter-spacing:.14em;
}
.sheet[data-design="register"] .rg-docid .rg-rule-d{border-top:1px solid #111;margin:7px 0 6px;height:0}
.sheet[data-design="register"] .rg-docid dl{margin:0;display:grid;grid-template-columns:auto auto;gap:3px 16px;justify-content:end}
.sheet[data-design="register"] .rg-docid dt{
  font-family:var(--sans);font-size:7.5px;letter-spacing:.14em;text-transform:uppercase;
  color:#6a6a6a;font-weight:600;text-align:right;align-self:baseline;
}
.sheet[data-design="register"] .rg-docid dd{
  margin:0;font-family:var(--serif);font-size:11px;color:#323232;text-align:right;font-weight:500;
}
.sheet[data-design="register"] .rg-docid dd .rg-mono{font-family:var(--mono);font-size:10px;letter-spacing:.01em}

/* engraved double rule beneath the letterhead */
.sheet[data-design="register"] .rg-masthead-rule{height:0;border-top:2px solid #111;position:relative;margin-top:2px}
.sheet[data-design="register"] .rg-masthead-rule::after{content:"";position:absolute;left:0;right:0;top:2.5px;border-top:0.5px solid #111}

/* statement-of-scope line */
.sheet[data-design="register"] .rg-scope{
  display:flex;justify-content:space-between;align-items:baseline;padding:9px 1px 12px;
}
.sheet[data-design="register"] .rg-scope .rg-lede{
  font-family:var(--serif);font-size:11px;color:#323232;font-style:italic;letter-spacing:.01em;
}
.sheet[data-design="register"] .rg-scope .rg-lede b{font-style:normal;font-weight:600;color:#111}
.sheet[data-design="register"] .rg-scope .rg-dir{
  font-family:var(--sans);font-size:7.5px;letter-spacing:.20em;text-transform:uppercase;
  color:#6a6a6a;font-weight:600;border:1px solid #c4c4c4;padding:4px 9px;border-radius:1px;white-space:nowrap;
}
.sheet[data-design="register"] .rg-scope .rg-dir b{color:#111;font-weight:700}

/* ================= STATEMENT TABLE (bank-statement ledger) ================= */
.sheet[data-design="register"] .rg-stmt-tbl{width:100%;border-collapse:collapse;table-layout:fixed}
.sheet[data-design="register"] .rg-stmt-tbl col.rg-c-date{width:26mm}
.sheet[data-design="register"] .rg-stmt-tbl col.rg-c-part{width:auto}
.sheet[data-design="register"] .rg-stmt-tbl col.rg-c-pcs{width:18mm}
.sheet[data-design="register"] .rg-stmt-tbl col.rg-c-amt{width:24mm}
.sheet[data-design="register"] .rg-stmt-tbl col.rg-c-bal{width:24mm}
.sheet[data-design="register"] .rg-stmt-tbl th,
.sheet[data-design="register"] .rg-stmt-tbl td{padding:0}

/* --- engraved column header band --- */
.sheet[data-design="register"] .rg-stmt-tbl thead th{
  font-family:var(--sans);font-size:7.5px;letter-spacing:.16em;text-transform:uppercase;
  font-weight:700;color:#111;padding:0 8px 5px;text-align:right;vertical-align:bottom;
  border-bottom:1px solid #111;line-height:1.2;
}
.sheet[data-design="register"] .rg-stmt-tbl thead th small{
  display:block;font-family:var(--sans);font-size:5.8px;letter-spacing:.10em;
  color:#6a6a6a;font-weight:600;margin-top:2px;
}
.sheet[data-design="register"] .rg-stmt-tbl thead th.rg-h-date{text-align:left;padding-left:2px}
.sheet[data-design="register"] .rg-stmt-tbl thead th.rg-h-part{text-align:left;padding-left:10px}
.sheet[data-design="register"] .rg-stmt-tbl thead th.rg-h-bal{border-left:1px solid #111}

/* --- body rows --- */
.sheet[data-design="register"] .rg-stmt-tbl tbody td{
  border-bottom:0.5px solid #dadada;height:19px;vertical-align:middle;
  font-family:var(--mono);font-size:9.5px;color:#111;text-align:right;padding:0 8px;
  font-variant-numeric:tabular-nums;
}
.sheet[data-design="register"] .rg-stmt-tbl tbody tr:nth-child(even) td{background:#f9f9f9}

/* date cell */
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-date{
  font-family:var(--serif);text-align:left;font-size:10.5px;color:#111;
  padding-left:2px;letter-spacing:.005em;font-weight:600;white-space:nowrap;
}
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-date .rg-dow{
  font-family:var(--sans);font-size:7px;letter-spacing:.10em;text-transform:uppercase;
  color:#6a6a6a;font-weight:700;margin-right:5px;
}
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-date .rg-seq{
  font-family:var(--mono);font-size:6.5px;color:#9a9a9a;letter-spacing:.04em;
  margin-left:6px;font-weight:500;
}

/* particulars cell — serif prose list of items dispatched */
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-part{
  font-family:var(--serif);text-align:left;font-size:9.5px;color:#323232;
  padding-left:10px;letter-spacing:.005em;line-height:1.35;white-space:normal;
}
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-part .rg-pitem{color:#111}
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-part .rg-pqty{
  font-family:var(--mono);font-size:8.5px;color:#5c5c5c;font-weight:500;
}
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-part .rg-sep{color:#bcbcbc;margin:0 2px}

.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-pcs{font-weight:500}
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-amt .rg-cur{font-family:var(--serif);font-size:8px;color:#6a6a6a;margin-right:1px}
/* running balance — engraved separator, emphasised */
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-bal{
  border-left:1px solid #111;font-weight:600;color:#111;
}
.sheet[data-design="register"] .rg-stmt-tbl thead th.rg-h-amt.rg-mute,
.sheet[data-design="register"] .rg-stmt-tbl tbody td.rg-amt.rg-mute{color:#9a9a9a}

/* --- grand total row : engraved, double-ruled close --- */
.sheet[data-design="register"] .rg-stmt-tbl tbody tr.rg-grand td{
  border-top:1.5px solid #111;border-bottom:none;height:26px;
  background:transparent!important;font-weight:700;
}
.sheet[data-design="register"] .rg-stmt-tbl tbody tr.rg-grand td.rg-gcap{
  font-family:var(--serif);text-align:left;font-size:11px;
  font-variant:small-caps;letter-spacing:.12em;color:#111;padding-left:2px;
}
.sheet[data-design="register"] .rg-stmt-tbl tbody tr.rg-grand td.rg-gsub{
  font-family:var(--sans);text-align:left;font-size:7px;letter-spacing:.14em;
  text-transform:uppercase;color:#6a6a6a;font-weight:600;padding-left:10px;
}
.sheet[data-design="register"] .rg-stmt-tbl tbody tr.rg-grand td.rg-grecap{
  font-family:var(--mono);text-align:right;font-size:11px;color:#111;
}
.sheet[data-design="register"] .rg-stmt-tbl tbody tr.rg-grand td.rg-bal{border-left:1px solid #111}
.sheet[data-design="register"] .rg-stmt-tbl tbody tr.rg-grand td.rg-g-amt .rg-cur{font-family:var(--serif);font-size:9px;color:#323232;margin-right:1px;font-weight:600}
/* the closing double rule under grand total */
.sheet[data-design="register"] .rg-grand-close{height:0;border-top:2px solid #111;position:relative}
.sheet[data-design="register"] .rg-grand-close::after{content:"";position:absolute;left:0;right:0;top:2.4px;border-top:0.75px solid #111}

/* one-line reconcile note under the statement */
.sheet[data-design="register"] .rg-xnote{
  font-family:var(--serif);font-style:italic;font-size:9px;color:#6a6a6a;
  margin-top:8px;letter-spacing:.01em;padding-left:2px;
}
.sheet[data-design="register"] .rg-xnote b{font-style:normal;font-weight:600;color:#323232;font-family:var(--mono);font-size:8.5px}

/* ================= LOWER MATTER ================= */
.sheet[data-design="register"] .rg-lower{display:flex;justify-content:space-between;gap:22px;margin-top:8px;align-items:flex-start}

/* -- summary recapitulation rail -- */
.sheet[data-design="register"] .rg-recapblock{flex:0 0 152mm}
.sheet[data-design="register"] .rg-recapblock .rg-caption{
  font-family:var(--sans);font-size:7.5px;letter-spacing:.26em;text-transform:uppercase;
  color:#6a6a6a;font-weight:700;margin-bottom:7px;
}
.sheet[data-design="register"] .rg-rail{display:flex;border-top:1.5px solid #111;border-bottom:1px solid #111}
.sheet[data-design="register"] .rg-rail .rg-stat{flex:1;padding:8px 12px 9px;border-right:0.5px solid #c4c4c4}
.sheet[data-design="register"] .rg-rail .rg-stat:last-child{border-right:none}
.sheet[data-design="register"] .rg-rail .rg-stat .rg-lbl{
  font-family:var(--sans);font-size:7px;letter-spacing:.14em;text-transform:uppercase;
  color:#6a6a6a;font-weight:600;margin-bottom:5px;white-space:nowrap;
}
.sheet[data-design="register"] .rg-rail .rg-stat .rg-val{
  font-family:var(--serif);font-size:19px;font-weight:600;color:#111;
  line-height:1;letter-spacing:.005em;font-variant-numeric:tabular-nums;
}
.sheet[data-design="register"] .rg-rail .rg-stat .rg-val .rg-cur{font-size:12px;color:#6a6a6a;margin-right:1px}
.sheet[data-design="register"] .rg-rail .rg-stat .rg-val .rg-sub{font-family:var(--sans);font-size:8px;color:#6a6a6a;font-weight:600;letter-spacing:.04em;margin-left:3px}
.sheet[data-design="register"] .rg-rail .rg-stat.rg-accent{background:#f4f4f4}

.sheet[data-design="register"] .rg-reconcile{
  font-family:var(--serif);font-style:italic;font-size:9px;color:#6a6a6a;margin-top:8px;letter-spacing:.01em;
}
.sheet[data-design="register"] .rg-reconcile b{font-style:normal;font-weight:600;color:#323232;font-family:var(--mono);font-size:8.5px}

/* -- signature block -- */
.sheet[data-design="register"] .rg-attest{flex:1;padding-top:0}
.sheet[data-design="register"] .rg-attest .rg-caption{
  font-family:var(--sans);font-size:7.5px;letter-spacing:.26em;text-transform:uppercase;
  color:#6a6a6a;font-weight:700;margin-bottom:7px;
}
.sheet[data-design="register"] .rg-attest .rg-stmt{
  font-family:var(--serif);font-size:9.5px;line-height:1.5;color:#323232;margin:0 0 14px;letter-spacing:.005em;
}
.sheet[data-design="register"] .rg-sigrow{display:flex;gap:26px}
.sheet[data-design="register"] .rg-sigrow .rg-sig{flex:1}
.sheet[data-design="register"] .rg-sigrow .rg-sig .rg-line{border-top:1px solid #111;height:0;margin-bottom:5px}
.sheet[data-design="register"] .rg-sigrow .rg-sig .rg-role{
  font-family:var(--sans);font-size:7.5px;letter-spacing:.14em;text-transform:uppercase;color:#111;font-weight:700;
}
.sheet[data-design="register"] .rg-sigrow .rg-sig .rg-meta{
  font-family:var(--sans);font-size:7px;letter-spacing:.10em;text-transform:uppercase;color:#6a6a6a;font-weight:600;margin-top:2px;
}
.sheet[data-design="register"] .rg-sigrow .rg-sig .rg-filled{
  font-family:var(--serif);font-size:10px;color:#323232;font-style:italic;padding-bottom:4px;
}

/* ================= COLOPHON ================= */
.sheet[data-design="register"] .rg-colophon{
  display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:6px;
  border-top:0.5px solid #c4c4c4;font-family:var(--sans);font-size:7px;letter-spacing:.16em;
  text-transform:uppercase;color:#9a9a9a;font-weight:600;
}
.sheet[data-design="register"] .rg-colophon .rg-brandline{color:#6a6a6a}
.sheet[data-design="register"] .rg-colophon .rg-brandline b{color:#323232;font-weight:700}
.sheet[data-design="register"] .rg-colophon .rg-seal{letter-spacing:.30em}
`;

export function renderRegister(engine: Engine, C: Ctx): string {
    const {
        PROPERTY, VENDOR, MONTH, MABBR, GEN, ROOMS, DAYS, rows, dayTot, gQty, gCost, nDisp,
        dow, disp, inr, cfg, scheduleLabel,
    } = engine;

    const DOW_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const showCost = cfg.cost && C.disp; // Amount column only when dispatching

    let h = "";

    h += '<div class="rg-wrap">';
    h += '<div class="rg-key1"></div><div class="rg-key2"></div>';
    h += '<div class="rg-inner">';

    /* ===== LETTERHEAD ===== */
    h += '<header class="rg-head">';
    h += '<div class="rg-brand">';
    h += '<p class="rg-estd">Linen &amp; Laundry Reconciliation</p>';
    h += '<h1 class="rg-property">' + PROPERTY + "</h1>";
    h += '<p class="rg-subline">Monthly Detail Sheet &middot; ' + (C.disp ? "Dispatched" : "Received") + " Linen Register</p>";
    h += "</div>";
    h += '<div class="rg-docid">';
    h += '<div class="rg-kicker">Statement</div>';
    h += '<div class="rg-title">Laundry Detail</div>';
    h += '<div class="rg-rule-d"></div>';
    h += "<dl>";
    h += "<dt>Period</dt><dd>" + MONTH + "</dd>";
    h += "<dt>Vendor</dt><dd>" + VENDOR + "</dd>";
    h += "<dt>Direction</dt><dd>" + C.dirWord + "</dd>";
    h += '<dt>Generated</dt><dd><span class="rg-mono">' + GEN + "</span></dd>";
    h += "</dl>";
    h += "</div>";
    h += "</header>";

    h += '<div class="rg-masthead-rule"></div>';

    /* ===== SCOPE ===== */
    h += '<div class="rg-scope">';
    h += '<div class="rg-lede">Being a true and itemised account of all linen <b>' + C.dirWord.toLowerCase() + "</b> during the period, presented for verification against the vendor&rsquo;s challans.</div>";
    h += '<div class="rg-dir">' + (C.disp ? "Dispatch" : "Receipt") + " days &middot; <b>" + scheduleLabel + "</b></div>";
    h += "</div>";

    /* ===== STATEMENT (chronological running-balance ledger) ===== */
    h += '<table class="rg-stmt-tbl">';

    h += "<colgroup>";
    h += '<col class="rg-c-date">';
    h += '<col class="rg-c-part">';
    h += '<col class="rg-c-pcs">';
    if (showCost) h += '<col class="rg-c-amt">';
    h += '<col class="rg-c-bal">';
    h += "</colgroup>";

    h += "<thead><tr>";
    h += '<th class="rg-h-date">Date</th>';
    h += '<th class="rg-h-part">Particulars<small>' + (C.disp ? "items dispatched" : "items received") + "</small></th>";
    h += '<th class="rg-h-pcs">Pieces<small>on date</small></th>';
    if (showCost) h += '<th class="rg-h-amt"><span style="font-family:var(--serif)">&#8377;</span> Amount<small>on date</small></th>';
    h += '<th class="rg-h-bal">Balance<small>cumulative</small></th>';
    h += "</tr></thead>";

    h += "<tbody>";
    let running = 0;
    let seq = 0;
    for (let i = 0; i < DAYS; i++) {
        if (!disp(i)) continue;
        seq++;
        const pcs = dayTot[i];
        running += pcs;

        const parts: string[] = [];
        let amt = 0;
        rows.forEach((r) => {
            const q = r.daily[i];
            if (q > 0) {
                parts.push('<span class="rg-pitem">' + r.name + '</span> <span class="rg-pqty">&times;' + q + "</span>");
                amt += q * r.price;
            }
        });
        const particulars = parts.length
            ? parts.join('<span class="rg-sep">&middot;</span>')
            : '<span style="color:#9a9a9a;font-style:italic">no linen recorded</span>';

        h += "<tr>";
        h += '<td class="rg-date"><span class="rg-dow">' + DOW_ABBR[dow(i)] + "</span>" + (i + 1) + " " + MABBR + '<span class="rg-seq">' + ("0" + seq).slice(-2) + "/" + nDisp + "</span></td>";
        h += '<td class="rg-part">' + particulars + "</td>";
        h += '<td class="rg-pcs">' + inr(pcs) + "</td>";
        if (showCost) h += '<td class="rg-amt"><span class="rg-cur">&#8377;</span>' + inr(amt) + "</td>";
        h += '<td class="rg-bal">' + inr(running) + "</td>";
        h += "</tr>";
    }

    /* ===== GRAND TOTAL (double-ruled close) ===== */
    h += '<tr class="rg-grand">';
    h += '<td class="rg-gcap">Grand Total</td>';
    h += '<td class="rg-gsub">' + nDisp + " " + (C.disp ? "dispatch" : "receipt") + " dates &middot; " + MONTH + "</td>";
    h += '<td class="rg-grecap">' + inr(gQty) + "</td>";
    if (showCost) h += '<td class="rg-grecap rg-g-amt"><span class="rg-cur">&#8377;</span>' + inr(gCost) + "</td>";
    h += '<td class="rg-grecap rg-bal">' + inr(gQty) + "</td>";
    h += "</tr>";

    h += "</tbody>";
    h += "</table>";
    h += '<div class="rg-grand-close"></div>';

    if (cfg.xcheck) {
        h += '<div class="rg-xnote">Reconcile: the running balance closes at <b>' + inr(gQty) + "</b> pieces across the " + nDisp + " " + (C.disp ? "dispatch" : "receipt") + " dates, equal to the grand total &mdash; ledger balances.</div>";
    }

    h += '<div class="rg-spacer"></div>';

    /* ===== LOWER MATTER ===== */
    h += '<div class="rg-lower">';

    h += '<div class="rg-recapblock">';
    h += '<div class="rg-caption">Recapitulation</div>';
    h += '<div class="rg-rail">';
    type Stat = [string, string, string, string, boolean];
    const stats: Stat[] = [];
    stats.push(["Total Pieces", inr(gQty), "", "pcs", false]);
    if (showCost) stats.push(["Total Cost", inr(gCost), "&#8377;", "", true]);
    if (C.disp) stats.push(["Checkout Rooms", inr(ROOMS), "", "", false]);
    if (C.room) stats.push(["Pieces / Room", (gQty / ROOMS).toFixed(2), "", "", false]);
    if (C.room && showCost) stats.push(["Cost / Room", (gCost / ROOMS).toFixed(2), "&#8377;", "", false]);
    stats.forEach((s) => {
        const cur = s[2] ? '<span class="rg-cur">' + s[2] + "</span>" : "";
        const sub = s[3] ? '<span class="rg-sub">' + s[3] + "</span>" : "";
        h += '<div class="rg-stat' + (s[4] ? " rg-accent" : "") + '"><div class="rg-lbl">' + s[0] + "</div>" +
            '<div class="rg-val">' + cur + s[1] + sub + "</div></div>";
    });
    h += "</div>"; // rail

    if (cfg.xcheck) {
        h += '<div class="rg-reconcile">Cross-check: sum of the ' + nDisp + " daily totals = <b>" + inr(gQty) + "</b> pieces, " +
            "equal to the grand total &mdash; ledger balances.</div>";
    }
    h += "</div>"; // recapblock

    if (cfg.sign) {
        h += '<div class="rg-attest">';
        h += '<div class="rg-caption">Attestation</div>';
        h += '<p class="rg-stmt">The figures above have been checked against the ' + (C.disp ? "dispatch" : "receipt") + " records for the stated period and are certified a correct account of linen " + C.verb + " the vendor named herein.</p>";
        h += '<div class="rg-sigrow">';
        h += '<div class="rg-sig"><div class="rg-filled">&nbsp;</div><div class="rg-line"></div><div class="rg-role">Authorised Signatory</div><div class="rg-meta">For ' + PROPERTY + "</div></div>";
        h += '<div class="rg-sig"><div class="rg-filled">' + GEN.split(",")[0] + '</div><div class="rg-line"></div><div class="rg-role">Verified On</div><div class="rg-meta">Date of certification</div></div>';
        h += "</div>";
        h += "</div>";
    }

    h += "</div>"; // lower

    /* ===== COLOPHON ===== */
    h += '<div class="rg-colophon">';
    h += '<div class="rg-brandline"><b>' + PROPERTY + "</b> &middot; Laundry Ledger &middot; <span>" + MONTH + "</span></div>";
    h += '<div class="rg-seal">Reconciled &amp; Verified</div>';
    h += "</div>";

    h += "</div>"; // rg-inner
    h += "</div>"; // rg-wrap

    return h;
}
