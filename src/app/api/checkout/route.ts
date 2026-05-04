import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const Schema = z.object({ bookingId: z.string().min(1) });

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet. See README to add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { boat: true, waiver: true, payment: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!booking.waiver) {
    return NextResponse.json({ error: "Waiver must be completed before payment." }, { status: 409 });
  }
  if (booking.status === "deposit_paid") {
    return NextResponse.json({ error: "Deposit already paid" }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: booking.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: booking.currency,
          unit_amount: booking.depositCents, // server-calculated, not from client
          product_data: {
            name: `${booking.boat.name} — Deposit (${booking.depositPercent}%)`,
            description: `Boat rental deposit · ${booking.duration.replace("_", " ").toLowerCase()}`,
          },
        },
      },
    ],
    metadata: { bookingId: booking.id },
    payment_intent_data: { metadata: { bookingId: booking.id } },
    success_url: `${appUrl}/book/success?booking_id=${booking.id}`,
    cancel_url: `${appUrl}/book/payment/${booking.id}`,
  });

  await prisma.stripePayment.upsert({
    where: { bookingId: booking.id },
    update: {
      checkoutSessionId: session.id,
      amountCents: booking.depositCents,
      currency: booking.currency,
      status: "created",
    },
    create: {
      bookingId: booking.id,
      checkoutSessionId: session.id,
      amountCents: booking.depositCents,
      currency: booking.currency,
      status: "created",
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "pending_payment" },
  });

  return NextResponse.json({ url: session.url });
}
