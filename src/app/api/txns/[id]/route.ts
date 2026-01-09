import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getTransactionById } from "@/actions/reports/getTransactionById";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ params is a Promise in your Next version
) {
  await requireUser();

  const { id } = await params; // ✅ unwrap it
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Missing transaction id." },
      { status: 400 }
    );
  }

  const res = await getTransactionById(id);
  return NextResponse.json(res, { status: res.ok ? 200 : 404 });
}
