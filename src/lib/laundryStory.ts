/**
 * The WhatsApp stories: layman Hinglish updates in WhatsApp typography
 * (*bold*, _italic_, ```monospace```) with mood-first emoji. Never names
 * the laundry vendor — the word is always just "laundry" or "wash".
 *
 * Messages are ASSEMBLED from independent building blocks — header, lead
 * phrases, bullets, dividers, balance phrases, list-vs-receipt layout —
 * each picked at random, so thousands of combinations exist and no two
 * updates feel like the same rubber stamp. Sent and received have fully
 * separate pools and never share a shape.
 *
 * Every combination still carries the same facts:
 * - Sent     → what went today + the new TOTAL now with the laundry.
 * - Received → what came back today (kharab/rewash flagged) + what is
 *              STILL LEFT with the laundry.
 */

export type StorySentLine = { name: string; qty: number };

export type StoryReceivedLine = {
  name: string;
  clean: number;
  damaged: number;
  rewash: number;
};

export type StoryPendingLine = { name: string; qty: number };

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function fmtWhen(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

const WRONG_FIGURE_LINE =
  "⚠️ Hisaab mein kuch gadbad hai (minus figure) — admin check karein.";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Aligned row for the monospace "receipt" layout. */
function monoRow(name: string, qty: number) {
  return `${name.slice(0, 14).padEnd(15)}${String(qty).padStart(4)}`;
}

const MONO = "```";

function monoTable(rows: { name: string; qty: number }[], totalLabel: string) {
  const total = rows.reduce((s, r) => s + r.qty, 0);
  return (
    MONO +
    [
      ...rows.map((r) => monoRow(r.name, r.qty)),
      "─".repeat(19),
      monoRow(totalLabel, total),
    ].join("\n") +
    MONO
  );
}

type PendingCtx = {
  positive: StoryPendingLine[];
  total: number;
  hasWrong: boolean;
} | null;

function pendingCtx(pendingLines: StoryPendingLine[] | null): PendingCtx {
  if (!pendingLines) return null;
  const positive = pendingLines.filter((l) => l.qty > 0);
  return {
    positive,
    total: positive.reduce((s, l) => s + l.qty, 0),
    hasWrong: pendingLines.some((l) => l.qty < 0),
  };
}

/* Building blocks shared by both kinds (visual only, no words) */

const bullets = ["•", "▪️", "🔹", "‣", "–", "👉"] as const;

const dividers = [
  "━━━━━━━━━━━━━━",
  "┄┄┄┄┄┄┄┄┄┄┄┄┄┄",
  "──────────────",
  "═══════════════",
  "•••••••••••••••",
  "", // blank-line style
] as const;

/** Receipt layout shows up ~1 in 4 messages. */
const layouts = ["list", "list", "list", "receipt"] as const;

function pushDivider(out: string[], div: string) {
  if (div) out.push(div);
  else out.push("");
}

/* ------------------------------------------------------------------ */
/* SENT — linen leaving for the laundry                                */
/* ------------------------------------------------------------------ */

const sentHeaders = [
  "📤 *Laundry ko Bheja*",
  "🚛💨 *Laundry Nikal Gayi!*",
  "🧺 *Aaj ki Laundry Bheji*",
  "🫧 *Wash ke liye Gaya*",
  "📦👕 *Bheja Laundry Ko*",
  "🧺✨ *Laundry Update · Bheja*",
] as const;

const sentTodayEmojis = ["🧺", "👕", "📤", "🧼"] as const;

const sentTodayLeads = [
  (n: number) => `Aaj bheja: *${n} pcs*`,
  (n: number) => `Aaj itna bheja 👇 *${n} pcs*`,
  (n: number) => `Aaj laundry gaya: *${n} pcs*`,
  (n: number) => `Total bheja aaj: *${n} pcs*`,
  (n: number) => `Aaj ka bheja hua 👇 *${n} pcs*`,
] as const;

const sentBalanceEmojis = ["🚛", "🧾", "📦", "🤝"] as const;

const sentBalanceLeads = [
  (n: number) => `Ab laundry ke paas total: *${n} pcs*`,
  (n: number) => `Ab unke paas total baaki: *${n} pcs*`,
  (n: number) => `Laundry ke zimme ab: *${n} pcs*`,
  (n: number) => `Total abhi laundry mein: *${n} pcs*`,
  (n: number) => `Unke paas ab tak ka total: *${n} pcs*`,
] as const;

const sentAllClearLines = [
  "Laundry ke paas ab kuch baaki nahi ✅",
  "Sab hisaab clear — unke paas kuch nahi bacha ✅",
  "Unke paas zero baaki ✅",
] as const;

export function buildSentStory(input: {
  propertyName: string;
  when: Date;
  lines: StorySentLine[];
  /** Current per-item balance with the laundry, AFTER this entry. Null = unknown. */
  pendingLines: StoryPendingLine[] | null;
}): string {
  const total = input.lines.reduce((s, l) => s + l.qty, 0);
  const pending = pendingCtx(input.pendingLines);

  const header = pick(sentHeaders);
  const bullet = pick(bullets);
  const div = pick(dividers);
  const layout = pick(layouts);

  const out: string[] = [
    `${header} — ${input.propertyName}`,
    `_${fmtWhen(input.when)}_`,
  ];

  pushDivider(out, div);

  if (layout === "receipt") {
    out.push(`${pick(sentTodayEmojis)} ${pick(sentTodayLeads)(total)}`);
    out.push(monoTable(input.lines, "TOTAL"));
  } else {
    out.push(`${pick(sentTodayEmojis)} ${pick(sentTodayLeads)(total)}`);
    out.push(...input.lines.map((l) => `${bullet} ${l.name} — ${l.qty}`));
  }

  if (pending) {
    pushDivider(out, div);
    if (pending.total === 0 && !pending.hasWrong) {
      out.push(pick(sentAllClearLines));
    } else if (pending.total > 0) {
      out.push(
        `${pick(sentBalanceEmojis)} ${pick(sentBalanceLeads)(pending.total)}`
      );
      out.push(
        ...pending.positive.map((l) => `${bullet} ${l.name} — ${l.qty}`)
      );
    }
    if (pending.hasWrong) out.push(WRONG_FIGURE_LINE);
  }

  return out.join("\n");
}

/* ------------------------------------------------------------------ */
/* RECEIVED — fresh linen coming back                                  */
/* ------------------------------------------------------------------ */

const receivedHeaders = [
  "📥 *Laundry se Wapas Mila*",
  "✨👕 *Taaza Linen Aa Gaya!*",
  "🧺✅ *Laundry Wapas Aayi*",
  "🫧✨ *Fresh Linen Aa Gaya*",
  "📦👕 *Aaj ki Wapasi*",
  "🧺 *Laundry Update · Wapas Mila*",
] as const;

const receivedTodayEmojis = ["📥", "✨", "🧺", "👕"] as const;

const receivedTodayLeads = [
  (n: number) => `Aaj mila: *${n} pcs*`,
  (n: number) => `Aaj wapas mila 👇 *${n} pcs*`,
  (n: number) => `Laundry se aaya: *${n} pcs*`,
  (n: number) => `Aaj ki wapasi: *${n} pcs*`,
  (n: number) => `Wapas aa gaya: *${n} pcs*`,
] as const;

const receivedLeftEmojis = ["⏳", "🧾", "📦", "🚛"] as const;

const receivedLeftLeads = [
  (n: number) => `Abhi bhi laundry ke paas baaki: *${n} pcs*`,
  (n: number) => `Baaki abhi unke paas: *${n} pcs*`,
  (n: number) => `Itna aur aana hai: *${n} pcs*`,
  (n: number) => `Laundry ke paas reh gaya: *${n} pcs*`,
] as const;

const receivedAllClearLines = [
  "🎉 *Sab wapas aa gaya!* Laundry ke paas kuch baaki nahi ✅",
  "🥳 *Poora hisaab clear!* Kuch bhi baaki nahi ✅",
  "✅ *Sab aa gaya wapas* — laundry ke paas zero baaki 🎉",
] as const;

const rewashLeads = [
  (n: number) => `🔁 Dobara wash ke liye jayega: ${n} pcs`,
  (n: number) => `🔁 Ye firse wash hone jayega: ${n} pcs`,
  (n: number) => `🔁 Wapas wash ke liye: ${n} pcs`,
] as const;

function receivedItemLine(l: StoryReceivedLine, bullet: string) {
  const got = l.clean + l.damaged;
  const note = l.damaged > 0 ? ` (❌ ${l.damaged} kharab)` : "";
  return `${bullet} ${l.name} — ${got}${note}`;
}

export function buildReceivedStory(input: {
  propertyName: string;
  when: Date;
  lines: StoryReceivedLine[];
  pendingLines: StoryPendingLine[] | null;
}): string {
  // "Mila" counts what stays with the hotel (clean + damaged).
  // Rewash came back but is going straight back for another wash.
  const kept = input.lines.reduce((s, l) => s + l.clean + l.damaged, 0);
  const damaged = input.lines.reduce((s, l) => s + l.damaged, 0);
  const rewash = input.lines.reduce((s, l) => s + l.rewash, 0);
  const pending = pendingCtx(input.pendingLines);

  const header = pick(receivedHeaders);
  const bullet = pick(bullets);
  const div = pick(dividers);
  const layout = pick(layouts);

  const out: string[] = [
    `${header} — ${input.propertyName}`,
    `_${fmtWhen(input.when)}_`,
  ];

  pushDivider(out, div);

  out.push(`${pick(receivedTodayEmojis)} ${pick(receivedTodayLeads)(kept)}`);

  const keptRows = input.lines.filter((l) => l.clean + l.damaged > 0);
  if (layout === "receipt") {
    out.push(
      monoTable(
        keptRows.map((l) => ({ name: l.name, qty: l.clean + l.damaged })),
        "TOTAL MILA"
      )
    );
    if (damaged > 0) {
      const names = keptRows
        .filter((l) => l.damaged > 0)
        .map((l) => `${l.name} ${l.damaged}`)
        .join(", ");
      out.push(`❌ Kharab: ${damaged} (${names})`);
    }
  } else {
    out.push(...keptRows.map((l) => receivedItemLine(l, bullet)));
  }

  if (rewash > 0) {
    out.push(pick(rewashLeads)(rewash));
    out.push(
      ...input.lines
        .filter((l) => l.rewash > 0)
        .map((l) => `${bullet} ${l.name} — ${l.rewash}`)
    );
  }

  if (pending) {
    pushDivider(out, div);
    if (pending.total === 0 && !pending.hasWrong) {
      out.push(pick(receivedAllClearLines));
    } else if (pending.total > 0) {
      out.push(
        `${pick(receivedLeftEmojis)} ${pick(receivedLeftLeads)(pending.total)}`
      );
      out.push(
        ...pending.positive.map((l) => `${bullet} ${l.name} — ${l.qty}`)
      );
    }
    if (pending.hasWrong) out.push(WRONG_FIGURE_LINE);
  }

  return out.join("\n");
}
