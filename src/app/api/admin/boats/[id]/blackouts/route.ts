import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dateInBusinessTz } from "@/lib/timezone";

const Schema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().max(200).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const startsAt = dateInBusinessTz(parsed.data.startDate, parsed.data.startTime);
  const endsAt = dateInBusinessTz(parsed.data.endDate, parsed.data.endTime);
  if (endsAt <= startsAt) {
    return NextResponse.json({ error: "End must be after start." }, { status: 400 });
  }

  const boat = await prisma.boat.findUnique({ where: { id: params.id } });
  if (!boat) return NextResponse.json({ error: "Boat not found" }, { status: 404 });

  const created = await prisma.boatBlackout.create({
    data: { boatId: params.id, startsAt, endsAt, reason: parsed.data.reason },
  });
  return NextResponse.json({ id: created.id });
}
