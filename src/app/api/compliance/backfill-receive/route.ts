import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyServiceAuth } from "@/lib/serviceAuth";
import { backfillReceiveForPmsProperty } from "@/lib/complianceBackfill";
import { isValidDateKey } from "@/lib/dateKeys";

const ReceiveLineSchema = z
  .object({
    linenItemId: z.string().min(1),
    receivedCleanQty: z.number().int().nonnegative().optional(),
    damagedQty: z.number().int().nonnegative().optional(),
    rewashQty: z.number().int().nonnegative().optional(),
  })
  .refine(
    (l) =>
      (l.receivedCleanQty ?? 0) + (l.damagedQty ?? 0) + (l.rewashQty ?? 0) > 0,
    { message: "At least one qty is required per line" }
  );

const BodySchema = z.object({
  pmsPropertyId: z.number().int().positive(),
  vendorId: z.string().min(1),
  dateKey: z.string().refine(isValidDateKey, "Invalid dateKey"),
  lines: z.array(ReceiveLineSchema).min(1),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const authError = verifyServiceAuth(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid input", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = await backfillReceiveForPmsProperty(parsed.data);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
