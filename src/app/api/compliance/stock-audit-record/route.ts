import { NextResponse } from "next/server";
import { verifyServiceAuth } from "@/lib/serviceAuth";
import { recordStockAuditWeeklyForPmsProperty } from "@/lib/stockAuditCompliance";

export async function POST(req: Request) {
  const authError = verifyServiceAuth(req);
  if (authError) return authError;

  let body: {
    pmsPropertyId?: unknown;
    weekStartYmd?: unknown;
    mode?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const pmsPropertyId = Number(body.pmsPropertyId);
  if (!Number.isFinite(pmsPropertyId) || pmsPropertyId <= 0) {
    return NextResponse.json(
      { ok: false, message: "Invalid pmsPropertyId." },
      { status: 400 }
    );
  }

  const weekStartYmd =
    typeof body.weekStartYmd === "string" && body.weekStartYmd.trim()
      ? body.weekStartYmd.trim()
      : undefined;
  const mode =
    body.mode === "skip_if_exists" || body.mode === "replace"
      ? body.mode
      : "replace";

  try {
    const data = await recordStockAuditWeeklyForPmsProperty({
      pmsPropertyId,
      weekStartYmd,
      mode,
    });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status =
      message.includes("weekStartYmd") || message.includes("mapping")
        ? 400
        : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
