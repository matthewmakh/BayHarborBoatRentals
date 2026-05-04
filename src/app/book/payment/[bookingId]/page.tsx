import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { prisma } from "@/lib/prisma";
import { durationLabel, formatUSD } from "@/lib/pricing";
import { isStripeConfigured } from "@/lib/stripe";
import { PaymentButton } from "./PaymentButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pay deposit" };

export default async function PaymentPage({ params }: { params: { bookingId: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { boat: true, waiver: true, payment: true },
  });
  if (!booking) notFound();

  const stripeReady = isStripeConfigured();

  return (
    <PublicShell>
      <section className="container-x py-12 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-navy-600">Step 3 of 3</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-serif text-navy-800">Pay your deposit</h1>

        <div className="mt-6 card p-6">
          <h2 className="text-lg font-semibold text-navy-800">Booking summary</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-navy-50 px-3 py-2">
              <dt className="text-xs uppercase text-navy-500">Boat</dt>
              <dd className="font-semibold text-navy-800">{booking.boat.name}</dd>
            </div>
            <div className="rounded-lg bg-navy-50 px-3 py-2">
              <dt className="text-xs uppercase text-navy-500">Duration</dt>
              <dd className="font-semibold text-navy-800">{durationLabel(booking.duration)}</dd>
            </div>
            <div className="rounded-lg bg-navy-50 px-3 py-2">
              <dt className="text-xs uppercase text-navy-500">Rental</dt>
              <dd className="font-semibold text-navy-800">{formatUSD(booking.rentalPriceCents)}</dd>
            </div>
            <div className="rounded-lg bg-navy-50 px-3 py-2">
              <dt className="text-xs uppercase text-navy-500">Deposit ({booking.depositPercent}%)</dt>
              <dd className="font-semibold text-navy-800">{formatUSD(booking.depositCents)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-navy-700">
            Status: <strong>{booking.status}</strong>
            {booking.waiver && <> · Waiver signed by {booking.waiver.fullLegalName}</>}
          </p>
        </div>

        <div className="mt-6">
          {!booking.waiver ? (
            <p className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              The waiver must be completed before you can pay. <a className="underline" href={`/book/waiver/${booking.id}`}>Go back</a>.
            </p>
          ) : booking.status === "deposit_paid" ? (
            <p className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
              Your deposit has been received. We'll email you a confirmation shortly.
            </p>
          ) : !stripeReady ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              Stripe is not yet configured. The owner must add <code>STRIPE_SECRET_KEY</code> and{" "}
              <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>. See README. Your booking is saved and we will follow up.
            </div>
          ) : (
            <PaymentButton bookingId={booking.id} />
          )}
        </div>
      </section>
    </PublicShell>
  );
}
