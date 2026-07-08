# DESIGN.md — Zenvana Laundry visual system

The single source of truth for how this app looks and moves. Written during the 2026-07 makeover; follow it for every new screen.

## Theme

- **Light theme is the default** (staff work in bright linen rooms; sun-glare legibility wins). Dark theme exists and every token has a `.dark` value. Theme toggle lives in the account drawer, not floating on screens.
- All colors are OKLCH CSS variables in `src/app/globals.css`. **Never hardcode Tailwind palette colors** (`violet-600`, `amber-50`, `zinc-950`…) in components; use the semantic tokens below.

## Color roles

| Token / utility | Use |
|---|---|
| `bg-background` / `text-foreground` | Page canvas and ink |
| `bg-card` + `.surface` utility | Opaque cards: white card, hairline border, 1px shadow. **No backdrop-blur, no translucency** (GPU cost on budget Androids) |
| `bg-primary text-primary-foreground` | The one action color (deep violet). Primary buttons, active nav/chips, selection checks |
| `bg-secondary`, `bg-muted`, `bg-accent` | Quiet fills: secondary buttons, input shells, selected-row tint |
| `text-muted-foreground` | Secondary text only — passes 4.5:1 on background and card |
| `bg-destructive` | Destructive buttons only |
| Condition pairs: `clean`/`clean-soft`, `soiled`/`soiled-soft`, `rewash`/`rewash-soft`, `damaged`/`damaged-soft` | The linen vocabulary. CLEAN=green, SOILED=amber, REWASH=sky, DAMAGED=rose. Text tone on its `-soft` tint passes AA. Flows inherit them: Send=soiled, Receive=clean. Positive deltas = clean, negative = damaged |

## Typography

- System font stack (`--font-sans`); no webfonts, ever.
- Fixed rem scale: 12 (`text-xs` chip labels) · 14 (`text-sm` secondary) · 16 (`text-base` body/rows) · 18 (`text-lg` drawer titles, big numbers) · 20 (`text-xl` page titles) · 24 (`text-2xl` totals) · 30 (`text-3xl` headline stats).
- Weights: `font-medium` labels, `font-semibold` row titles, `font-bold` titles/numbers.
- Every count/total gets `data-numeric` or `tabular-nums`.

## Radii & spacing

- `--radius: 1rem`. Cards/rows `rounded-2xl`, inner elements `rounded-xl`, chips/pills `rounded-full`, drawers `rounded-t-3xl`.
- Screen padding `px-4`, content column `max-w-md mx-auto` on staff screens (`max-w-2xl` acceptable for dense admin tables).
- Touch targets ≥ 44px; staff-flow primary buttons are `size="xl"` (56px).

## Components (use these, don't reinvent)

- `PageHeader` (`components/mobile/`) — sticky title + plain-language subtitle + optional back.
- `BottomSheetSelect`, `PropertyPicker` (reports) — vaul drawer pickers. Tap-to-choose, no Done buttons, no search under 9 options.
- `QtyStepper`, `CounterList`/`CounterRow` — counting rows.
- `Drawer*` (`components/ui/drawer.tsx`, vaul) — ALL mobile sheets/dialogs. Radix `Sheet`/`Dialog` only for desktop-admin contexts.
- `StickyBar` — fixed bottom CTA bar on flow screens (tab bar auto-hides there).
- `SuccessScreen` — end of every staff flow.
- `StatusPill` — condition chip, always with the word, never icon-only.
- `Button` — sizes `sm/default/lg/xl`, has built-in press feedback. Never override its colors inline.
- Toasts: **sonner only** (`toast.success/error`), Toaster mounted once in `(app)/layout.tsx`. react-hot-toast is banned.

## Motion (Emil Kowalski school)

- CSS-first: `transform`/`opacity` only, 150–300ms, `--ease-out-quart` for micro, `--ease-fluent` (cubic-bezier(0.32, 0.72, 0, 1)) for sheets/expands.
- Available utilities: `.press` (tap scale), `animate-fade-up`, `animate-fade-in`, `animate-scale-in`, `animate-num-up/down`, `animate-pop`, `.check-draw`.
- Expanding content: CSS grid-rows trick (`grid-rows-[0fr]→[1fr]`), not height animation libraries.
- **framer-motion is banned from staff routes** (bundle + jank on budget phones). No page-load stagger choreography anywhere in product UI.
- Everything respects `prefers-reduced-motion` (global override in globals.css).

## Copy rules (non-tech-savvy housekeeping staff)

- Plain hotel words: "Send to laundry", "Receive from laundry", "Ready to use", "To be washed", "At the laundry", "Wash again", "Thrown away / lost", "Register", "Entry", "Cancelled".
- Banned in staff-facing UI: Dispatch, Txn, Ledger, Voided, SKU, qtyΔ, enum names (`CLEAN_STORE`), "audit log".
- Use `txnLabel()` / `txnTone()` from `src/lib/txnLabels.ts` for transaction types.
- Buttons: verb + object ("Review & send", "Yes, cancel entry"). Every screen has one plain-language subtitle telling staff what it's for.
- Icons never appear without a word next to them (except back/close chevrons).

## Hard rules

- **No backdating**: staff record what happens now. No date inputs in any flow that posts laundry-cycle transactions; corrections preserve the original `occurredAt`.
- Never write a running balance (ledger rule, see CLAUDE.md).
- Confirm-before-commit: every posting flow ends in a review drawer with a human-readable read-back, then a SuccessScreen.
- z-index only from the scale: `--z-header/sticky/nav/overlay/toast`.
- Empty states teach ("Ask your admin to add items"), never bare "No data".
