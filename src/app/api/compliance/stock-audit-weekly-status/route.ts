import { NextResponse } from "next/server";
import { verifyServiceAuth } from "@/lib/serviceAuth";
import { getStockAuditWeeklyStatus } from "@/lib/stockAuditCompliance";

export async function GET(req: Request) {
  const authError = verifyServiceAuth(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const pmsPropertyIdRaw = url.searchParams.get("pmsPropertyId");
  const weekStartYmd = url.searchParams.get("weekStartYmd")?.trim() || undefined;

  const pmsPropertyId = Number(pmsPropertyIdRaw);
  if (!Number.isFinite(pmsPropertyId) || pmsPropertyId <= 0) {
    return NextResponse.json(
      { ok: false, message: "Invalid pmsPropertyId." },
      { status: 400 }
    );
  }

  try {
    const data = await getStockAuditWeeklyStatus({ pmsPropertyId, weekStartYmd });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message.includes("weekStartYmd") ? 400 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
