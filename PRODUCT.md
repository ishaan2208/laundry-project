# Product

## Register

product

## Users

- **Housekeeping staff / storekeepers** (primary): hotel linen-room and floor staff at Indian properties. Not tech-savvy; many are first-generation smartphone users on budget Android phones (₹8k class, 2–4 GB RAM, mid-range GPU, often patchy 4G). They use the app standing up, one-handed, in bright linen rooms or at the service gate while a laundry van waits. Counting linen with one hand, phone in the other. Speed and zero ambiguity beat density.
- **Admins / owners** (secondary): manage properties, vendors, items, pricing, users; review physical counts; trigger the monthly closing audit; read reports and billing. Comfortable with denser UI.
- **Accountants** (occasional): billing, vendor ledgers, reports.

## Product Purpose

Zenvana Laundry: a signed-ledger linen inventory app for the StaySystems hotel platform. Staff record every linen movement (send to laundry, receive back, rewash, damage, discard, physical counts); the ledger derives all balances — nothing is stored as a running total. It answers three questions instantly: *how much linen do we have*, *how much is with the laundry vendor*, and *what moved today*. When wrong entries pile up (bloated or negative pending), the admin triggers a **Fresh start** — any time, not on a calendar: counted reality replaces the book in one correction entry and everything continues from a clean slate. Success = staff enter movements correctly on the first try without training, and owners trust the numbers.

## Brand Personality

Calm, trustworthy, effortless. "A world-class tool that feels as simple as a notebook." The interface should feel like hotel linen itself: crisp, clean, orderly. Motion is fluid but restrained (Emil Kowalski school: fast ease-out transforms, purposeful feedback, nothing decorative).

## Anti-references

- **Enterprise ERP screens** (SAP/Tally-style dense grids, jargon like "Dispatch", "Txn", "Ledger" in staff-facing UI).
- **Glassmorphism/gradient SaaS dashboards** — backdrop blurs and translucent cards (also GPU-expensive on budget phones).
- **Form-first bureaucracy**: date pickers, reference numbers, and optional fields in the staff path. Staff flows are counting flows, not forms.
- Anything requiring typing where tapping works.

## Design Principles

1. **One job per screen.** Every staff screen has exactly one primary action, stated in plain hotel words ("Send to laundry", "Receive clean linen"), with a one-line description. If a screen needs explaining, it's wrong.
2. **Tap, never type.** Counting via steppers, choosing via sheets with big rows. Text input is reserved for admin surfaces. Minimum 48px touch targets in staff flows.
3. **Today only, truth always.** Staff record what is happening *now* — no backdating anywhere in the staff path. The ledger derives every number on screen; the UI never invents or caches a balance.
4. **Confirm before commit, celebrate after.** Movements are hard to undo (void = admin reversal), so every flow ends in a human-readable review ("Sending 24 bedsheets to CleanCo") and a loud success state staff can trust without reading.
5. **Budget-phone budget.** Ship the minimum: system fonts, opaque surfaces, CSS-first motion on transform/opacity only, no blur, no page-load choreography, smallest possible JS on staff routes.

## Accessibility & Inclusion

- Effective WCAG AA: body text ≥ 4.5:1, large text ≥ 3:1 — verified against tinted backgrounds; high-glare legibility (light theme default).
- Low tech-literacy users: icon + word labels always paired; no icon-only actions in staff flows; simple English copy (Hindi-friendly vocabulary, short words).
- `prefers-reduced-motion` honored on every animation (crossfade or none).
- One-handed reach: primary actions in the bottom third of the viewport; bottom-sheet pickers, sticky CTAs.
