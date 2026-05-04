import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { notifyCustomerBookingConfirmed, notifyDepositPaid } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const stripe = getStripe();
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSessionCompleted(session, JSON.stringify(event));
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSessionCompleted(session, JSON.stringify(event));
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await prisma.stripePayment.updateMany({
          where: { checkoutSessionId: session.id },
          data: { status: "failed", rawEvent: JSON.stringify(event) },
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi) {
          await prisma.stripePayment.updateMany({
            where: { paymentIntentId: pi },
            data: { status: "refunded", rawEvent: JSON.stringify(event) },
          });
        }
        break;
      }
      default:
        // ignore other event types
        break;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook handling failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handleSessionCompleted(session: Stripe.Checkout.Session, raw: string) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const paid = session.payment_status === "paid";

  const updatedPayment = await prisma.stripePayment.update({
    where: { bookingId },
    data: {
      checkoutSessionId: session.id,
      paymentIntentId,
      status: paid ? "succeeded" : "processing",
      amountCents: session.amount_total ?? undefined,
      currency: (session.currency ?? "usd").toLowerCase(),
      rawEvent: raw,
    },
  });

  if (paid) {
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "deposit_paid" },
      include: { boat: true },
    });
    notifyDepositPaid(updatedBooking, updatedPayment).catch(() => undefined);
    notifyCustomerBookingConfirmed(updatedBooking, updatedPayment).catch(() => undefined);
  }
}
