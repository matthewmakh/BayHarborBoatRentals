import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcDepositCents, priceForDuration } from "@/lib/pricing";
import { getInstantReservationsEnabled } from "@/lib/settings";
import { notifyBookingSubmitted } from "@/lib/notifications";
import { isSlotAvailable } from "@/lib/availability";
import { dateInBusinessTz } from "@/lib/timezone";

const Schema = z.object({
  boatId: z.string().min(1),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  notes: z.string().max(2000).optional(),
  duration: z.enum(["TWO_HOUR", "FOUR_HOUR", "SIX_HOUR", "EIGHT_HOUR"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
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
  const data = parsed.data;

  if (!(await getInstantReservationsEnabled())) {
    return NextResponse.json({ error: "Online reservations are temporarily disabled. Please call us." }, { status: 403 });
  }

  const boat = await prisma.boat.findUnique({ where: { id: data.boatId } });
  if (!boat) return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  if (boat.status !== "available") {
    return NextResponse.json({ error: "Boat is not available for booking." }, { status: 409 });
  }

  // Server-side check for the requested slot
  const scheduledAt = dateInBusinessTz(data.date, data.time);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });
  }
  const availability = await isSlotAvailable(boat.id, scheduledAt, data.duration);
  if (!availability.ok) {
    return NextResponse.json({ error: availability.error }, { status: 409 });
  }

  // Server-calculated price/deposit — never trust client.
  const rentalPriceCents = priceForDuration(boat, data.duration);
  const { depositCents, depositPercent } = await calcDepositCents(boat, data.duration);

  const booking = await prisma.booking.create({
    data: {
      boatId: boat.id,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      duration: data.duration,
      rentalPriceCents,
      depositCents,
      depositPercent,
      status: "pending_waiver",
      scheduledAt,
      endsAt: availability.endsAt,
    },
    include: { boat: true },
  });

  notifyBookingSubmitted(booking).catch(() => undefined);

  return NextResponse.json({ bookingId: booking.id });
}
