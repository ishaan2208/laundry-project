# laundry-project

Hotel linen inventory app for the StaySystems platform (laundry module). Tracks linen dispatched to/from laundry vendors, stock balances, physical counts, and billing across multiple properties. The whole system is a signed ledger of linen movements — every number on screen is derived, never stored directly.

## Architecture & intent

- **Next.js 16 App Router, React 19, TS 5.** Mutations are **Server Actions** in `src/actions/`, grouped by domain (`transactions/`, `reports/`, `masters/`, `physicalCount/`, `admin/users/`, `ui/`). Route Handlers in `src/app/api/` cover cron (weekly stock-audit snapshot), compliance backfill, and PDF export.
- **Ledger model is the core.** Balances are computed from `TransactionEntry` rows — each a signed `qtyDelta` against a `(locationId, linenItemId, condition)` — not stored as a running total. See `src/lib/ledger.ts`. `Location` rows are system-managed buckets (CLEAN_STORE, SOILED_STORE, REWASH_BIN, DAMAGED_BIN, DISCARDED_LOST, VENDOR); `src/lib/workflowLocations.ts` maps each `TxnType` to its source/destination bucket. Trust this mapping when adding transaction types.
- **DB:** PostgreSQL (Neon) + Prisma 7 in driver-adapter mode (`@prisma/adapter-pg`). The Prisma client is generated **locally into `src/generated/prisma/`**, not `node_modules`. `src/lib/db.ts` is a lazy proxy that validates the generated client is current (checks the `physicalStockCount` delegate) and throws a clear error if stale.
- **Auth:** Clerk sessions. `requireUser()` / `requireRole()` / `requirePropertyAccess()` in `src/lib/auth.ts` upsert an internal `User` (by `authId` then email) and gate access. Roles: ADMIN / HOUSEKEEPING / ACCOUNTANT / STOREKEEPER.
- **Client state:** `useBootstrap` loads all master data (properties/vendors/items) once on mount via the `ui/getBootstrap` action. Mobile-first UI lives in `src/components/mobile/`.
- Fits the wider platform via `https://api.staysystems.in/api/v1` for compliance/daily-status reporting; `Property.pmsPropertyId` links to the backend.

## Boundaries

- **Never write a running balance.** Record movements as `TransactionEntry` deltas and let the ledger derive totals. Voids reverse via a paired reversal transaction, not by deletion.
- After any `prisma/schema.prisma` change, regenerate (`npx prisma generate`) and restart dev — code that imports a stale `src/generated/prisma/` client will fail at the `db.ts` proxy guard.
- Every mutation must go through the auth helpers in `src/lib/auth.ts` and respect property scoping — do not bypass `requirePropertyAccess`.
- `LAUNDRY_SERVICE_SECRET` (checked in `src/lib/serviceAuth.ts`) authenticates internal calls from `api.staysystems.in`; `ADMIN_EMAILS` (comma-separated) auto-grants ADMIN on first sign-up. Don't hardcode or log either.
- Stock-audit week boundaries are **IST (Asia/Kolkata)** — use `src/lib/stockAuditIstWeek.ts`, never local/UTC week math.
- Dev is pinned to **webpack** (`next dev -p 3005 --webpack`); do not switch to turbopack.

## Verify your work

```bash
pnpm lint          # eslint — must pass clean
pnpm build         # production build must succeed (catches type + RSC errors)
npx prisma generate  # after any schema change, before building
```

Done and correct: `lint` and `build` pass, the Prisma client regenerated for any schema change, ledger deltas balance (no orphaned/one-sided entries), and mutations stay behind the auth + property-scope guards.
