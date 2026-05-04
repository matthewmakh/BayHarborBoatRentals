import type { Booking, Boat, StripePayment, WaiverSubmission } from "@prisma/client";
import { durationLabel, formatUSD } from "./pricing";
import { notificationRecipient, sendEmail, wrapHtml } from "./email";

export async function notifyBookingSubmitted(booking: Booking & { boat: Boat }) {
  const html = wrapHtml(
    "New booking submitted",
    `<p>A new booking has been created and is awaiting waiver/payment.</p>
     <ul>
       <li><strong>Customer:</strong> ${escape(booking.fullName)} (${escape(booking.email)}, ${escape(booking.phone)})</li>
       <li><strong>Boat:</strong> ${escape(booking.boat.name)}</li>
       <li><strong>Duration:</strong> ${durationLabel(booking.duration)}</li>
       <li><strong>Rental price:</strong> ${formatUSD(booking.rentalPriceCents)}</li>
       <li><strong>Deposit (${booking.depositPercent}%):</strong> ${formatUSD(booking.depositCents)}</li>
       ${booking.notes ? `<li><strong>Notes:</strong> ${escape(booking.notes)}</li>` : ""}
       <li><strong>Booking ID:</strong> ${booking.id}</li>
     </ul>`
  );
  await sendEmail({ to: notificationRecipient(), subject: `New booking — ${booking.boat.name}`, html });
}

export async function notifyWaiverCompleted(booking: Booking & { boat: Boat }, waiver: WaiverSubmission) {
  const html = wrapHtml(
    "Waiver completed",
    `<p>${escape(waiver.fullLegalName)} signed the waiver for booking <strong>${booking.id}</strong>.</p>
     <ul>
       <li><strong>Boat:</strong> ${escape(booking.boat.name)}</li>
       <li><strong>Duration:</strong> ${durationLabel(booking.duration)}</li>
       <li><strong>Signed at:</strong> ${waiver.signedAt.toISOString()}</li>
       <li><strong>IP:</strong> ${escape(waiver.ipAddress || "n/a")}</li>
     </ul>`
  );
  await sendEmail({ to: notificationRecipient(), subject: `Waiver signed — ${booking.boat.name}`, html });
}

export async function notifyDepositPaid(
  booking: Booking & { boat: Boat },
  payment: StripePayment
) {
  const html = wrapHtml(
    "Deposit received",
    `<p>Stripe has confirmed the deposit for booking <strong>${booking.id}</strong>.</p>
     <ul>
       <li><strong>Customer:</strong> ${escape(booking.fullName)} (${escape(booking.email)})</li>
       <li><strong>Boat:</strong> ${escape(booking.boat.name)}</li>
       <li><strong>Amount paid:</strong> ${formatUSD(payment.amountCents)} ${payment.currency.toUpperCase()}</li>
       <li><strong>Status:</strong> ${payment.status}</li>
       <li><strong>Payment intent:</strong> ${escape(payment.paymentIntentId || "n/a")}</li>
     </ul>`
  );
  await sendEmail({ to: notificationRecipient(), subject: `Deposit paid — ${booking.boat.name}`, html });
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
