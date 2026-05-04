import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { prisma } from "@/lib/prisma";
import { durationLabel, formatUSD } from "@/lib/pricing";
import { WaiverForm } from "./WaiverForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign Waiver" };

export default async function WaiverPage({ params }: { params: { bookingId: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { boat: true, waiver: true },
  });
  if (!booking) notFound();

  const active = await prisma.waiverVersion.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });

  if (booking.waiver) {
    return (
      <PublicShell>
        <section className="container-x py-12 max-w-2xl">
          <h1 className="text-3xl font-serif text-navy-800">Waiver received</h1>
          <p className="mt-2 text-navy-700">
            Your waiver was signed by {booking.waiver.fullLegalName}. Continue to the deposit step.
          </p>
          <a className="btn-primary mt-6 inline-block" href={`/book/payment/${booking.id}`}>
            Continue to deposit
          </a>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="container-x py-12 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-navy-600">Step 2 of 3</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-serif text-navy-800">Sign the waiver</h1>
        <div className="mt-4 card p-5 text-sm text-navy-700">
          <p>
            <strong>Booking:</strong> {booking.boat.name} · {durationLabel(booking.duration)} ·{" "}
            {formatUSD(booking.rentalPriceCents)} (deposit {formatUSD(booking.depositCents)})
          </p>
        </div>

        {active ? (
          <article className="mt-6 card p-6 max-h-[420px] overflow-y-auto whitespace-pre-line text-navy-800 leading-relaxed">
            {active.body}
          </article>
        ) : (
          <p className="mt-6 text-rose-700">No active waiver published. Contact us before continuing.</p>
        )}

        {active && <WaiverForm bookingId={booking.id} waiverVersion={active.version} />}
      </section>
    </PublicShell>
  );
}
