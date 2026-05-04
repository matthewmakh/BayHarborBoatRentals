import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { durationLabel, formatUSD } from "@/lib/pricing";
import { BookingStatusForm } from "./BookingStatusForm";

export const dynamic = "force-dynamic";

export default async function BookingDetail({ params }: { params: { id: string } }) {
  const b = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { boat: true, payment: true, waiver: { include: { waiverVersion: true } } },
  });
  if (!b) notFound();

  return (
    <div className="container-x py-10 max-w-3xl">
      <Link href="/admin/bookings" className="text-sm text-navy-600 hover:text-navy-800">← Back</Link>
      <h1 className="mt-2 text-3xl font-serif text-navy-800">Booking #{b.id.slice(-6)}</h1>

      <div className="mt-6 card p-6 grid gap-3 text-sm">
        <Row label="Created">{b.createdAt.toLocaleString()}</Row>
        <Row label="Customer">{b.fullName}<br />{b.email} · {b.phone}</Row>
        <Row label="Boat">{b.boat.name}</Row>
        <Row label="Duration">{durationLabel(b.duration)}</Row>
        <Row label="Rental">{formatUSD(b.rentalPriceCents)}</Row>
        <Row label="Deposit">{formatUSD(b.depositCents)} ({b.depositPercent}%)</Row>
        <Row label="Status"><span className="badge">{b.status}</span></Row>
        <Row label="Notes">{b.notes || <span className="text-navy-400">—</span>}</Row>
        <Row label="Calendly event">{b.calendlyEventUri || <span className="text-navy-400">—</span>}</Row>
      </div>

      <h2 className="mt-8 text-xl font-semibold text-navy-800">Waiver</h2>
      {b.waiver ? (
        <div className="mt-2 card p-6 grid gap-2 text-sm">
          <Row label="Signed by">{b.waiver.fullLegalName}</Row>
          <Row label="Signed at">{b.waiver.signedAt.toLocaleString()}</Row>
          <Row label="Version">v{b.waiver.waiverVersion.version}</Row>
          <Row label="IP">{b.waiver.ipAddress || "—"}</Row>
          <Row label="User agent"><code className="break-all text-xs text-navy-600">{b.waiver.userAgent || "—"}</code></Row>
          <Row label="Confirmed">{b.waiver.confirmed ? "yes" : "no"}</Row>
        </div>
      ) : (
        <p className="mt-2 text-navy-600 text-sm">Waiver not yet signed.</p>
      )}

      <h2 className="mt-8 text-xl font-semibold text-navy-800">Stripe payment</h2>
      {b.payment ? (
        <div className="mt-2 card p-6 grid gap-2 text-sm">
          <Row label="Status">{b.payment.status}</Row>
          <Row label="Amount">{formatUSD(b.payment.amountCents)} {b.payment.currency.toUpperCase()}</Row>
          <Row label="Checkout session">{b.payment.checkoutSessionId}</Row>
          <Row label="Payment intent">{b.payment.paymentIntentId || "—"}</Row>
          <Row label="Updated">{b.payment.updatedAt.toLocaleString()}</Row>
        </div>
      ) : (
        <p className="mt-2 text-navy-600 text-sm">No Stripe payment recorded.</p>
      )}

      <h2 className="mt-8 text-xl font-semibold text-navy-800">Update status</h2>
      <BookingStatusForm bookingId={b.id} current={b.status} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <div className="text-xs uppercase tracking-wide text-navy-500">{label}</div>
      <div className="text-navy-800">{children}</div>
    </div>
  );
}
