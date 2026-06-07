import { NextResponse } from "next/server";

export function verifyServiceAuth(req: Request): NextResponse | null {
  const secret = process.env.LAUNDRY_SERVICE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "LAUNDRY_SERVICE_SECRET is not configured." },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  return null;
}
