import { NextResponse } from "next/server";
import { runCronStockAuditSnapshots } from "@/lib/runCronStockAuditSnapshots";

/**
 * Weekly snapshot job. Protect with CRON_SECRET.
 *
 * Schedule (example Vercel cron): `0 2 * * 1` → Mondays 02:00 UTC.
 * Configure `Authorization: Bearer <CRON_SECRET>` on the cron request.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const result = await runCronStockAuditSnapshots();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
