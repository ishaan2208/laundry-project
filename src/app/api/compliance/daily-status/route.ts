import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyServiceAuth } from "@/lib/serviceAuth";
import { getDailyComplianceStatus } from "@/lib/complianceQueries";
import { isValidDateKey } from "@/lib/dateKeys";

export async function GET(req: Request) {
  const authError = verifyServiceAuth(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const pmsPropertyIdRaw = url.searchParams.get("pmsPropertyId");
  const dateKey = url.searchParams.get("dateKey")?.trim() ?? "";

  const pmsPropertyId = Number(pmsPropertyIdRaw);
  if (!Number.isFinite(pmsPropertyId) || !isValidDateKey(dateKey)) {
    return NextResponse.json(
      { ok: false, message: "Invalid pmsPropertyId or dateKey." },
      { status: 400 }
    );
  }

  try {
    const data = await getDailyComplianceStatus({ pmsPropertyId, dateKey });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
