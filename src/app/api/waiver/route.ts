import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/clientIp";
import { notifyWaiverCompleted } from "@/lib/notifications";

const Schema = z.object({
  bookingId: z.string().min(1),
  fullLegalName: z.string().min(2).max(160),
  confirmed: z.literal(true),
});

export async function POST(req: Request) {
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
  const { bookingId, fullLegalName, confirmed } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { boat: true, waiver: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.waiver) return NextResponse.json({ error: "Waiver already signed" }, { status: 409 });

  const active = await prisma.waiverVersion.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });
  if (!active) return NextResponse.json({ error: "No active waiver published" }, { status: 500 });

  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || undefined;

  const submission = await prisma.waiverSubmission.create({
    data: {
      bookingId,
      waiverVersionId: active.id,
      fullLegalName,
      confirmed,
      ipAddress: ip,
      userAgent: ua,
      boatId: booking.boatId,
      duration: booking.duration,
    },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "waiver_completed" },
  });

  notifyWaiverCompleted(booking, submission).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
