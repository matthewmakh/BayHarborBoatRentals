import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { prisma } from "@/lib/prisma";
import { durationLabel, formatUSD } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reservation confirmed" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { booking_id?: string };
}) {
  const booking = searchParams.booking_id
    ? await prisma.booking.findUnique({
        where: { id: searchParams.booking_id },
        include: { boat: true, payment: true },
      })
    : null;

  return (
    <PublicShell>
      <section className="container-x py-16 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Reservation</p>
        <h1 className="mt-2 text-4xl font-serif text-navy-800">You're booked!</h1>
        <p className="mt-3 text-navy-700">
          Thanks for choosing Bay Harbor Boat Rentals. Your deposit is processing — a confirmation will arrive by email.
        </p>
        {booking && (
          <div className="mt-6 card p-6 text-sm text-navy-800">
            <p><strong>Boat:</strong> {booking.boat.name}</p>
            <p><strong>Duration:</strong> {durationLabel(booking.duration)}</p>
            <p><strong>Deposit:</strong> {formatUSD(booking.depositCents)}</p>
            <p><strong>Status:</strong> {booking.status}</p>
            <p className="mt-2 text-xs text-navy-500">Booking ID: {booking.id}</p>
          </div>
        )}
        <div className="mt-8 flex gap-3">
          <Link href="/" className="btn-secondary">Back to home</Link>
          <Link href="/boats" className="btn-primary">Browse more boats</Link>
        </div>
      </section>
    </PublicShell>
  );
}
