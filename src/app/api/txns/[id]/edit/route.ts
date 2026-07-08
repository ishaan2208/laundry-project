import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { editTransactionEntriesAction } from "@/actions/transactions/editTransactionEntries";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const res = await editTransactionEntriesAction({
    transactionId: id,
    reason: body?.reason,
    updates: body?.updates,
  });

  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
