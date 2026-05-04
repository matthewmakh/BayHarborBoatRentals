import type { Booking, Boat, StripePayment, WaiverSubmission } from "@prisma/client";
import { durationLabel, formatUSD } from "./pricing";
import { notificationRecipient, sendEmail, wrapHtml } from "./email";
import { formatBusinessDateTime } from "./timezone";
import { getAllSettings, SETTING_KEYS } from "./settings";

// ─────────────────────────────────────────────────────────────────────────────
// Admin notifications (operator) — sent to NOTIFICATION_EMAIL
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyBookingSubmitted(booking: Booking & { boat: Boat }) {
  const html = wrapHtml(
    "New booking submitted",
    `<p>A new booking has been created and is awaiting waiver/payment.</p>
     <ul>
       <li><strong>Customer:</strong> ${escape(booking.fullName)} (${escape(booking.email)}, ${escape(booking.phone)})</li>
       <li><strong>Boat:</strong> ${escape(booking.boat.name)}</li>
       <li><strong>Scheduled:</strong> ${formatBusinessDateTime(booking.scheduledAt)} → ${formatBusinessDateTime(booking.endsAt)}</li>
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

// ─────────────────────────────────────────────────────────────────────────────
// Customer notifications — sent to the booking email
// ─────────────────────────────────────────────────────────────────────────────

async function getBusinessFooter(): Promise<string> {
  const s = await getAllSettings();
  const phone = s[SETTING_KEYS.phone];
  const email = s[SETTING_KEYS.email];
  const address = s[SETTING_KEYS.address];
  const name = s[SETTING_KEYS.businessName];
  return `<p style="font-size:13px;color:#475569;margin:18px 0 0">
    Questions? Call <a href="tel:${phone.replace(/\D/g, "")}" style="color:#1f4e79;text-decoration:none;font-weight:600">${escape(phone)}</a>
    or email <a href="mailto:${escape(email)}" style="color:#1f4e79">${escape(email)}</a>.<br/>
    <span style="color:#64748b">${escape(name)} · ${escape(address)}</span>
  </p>`;
}

function customerWrap(title: string, body: string, footer: string): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f0f6fc;padding:24px;color:#0a2236;margin:0">
    <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #dbeafe">
      <div style="background:linear-gradient(135deg,#0a2236,#1f4e79);color:#fff;padding:28px 28px 24px;text-align:center">
        <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.5px">Bay Harbor</div>
        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.85);margin-top:4px">Boat Rentals</div>
      </div>
      <div style="padding:28px">
        <h1 style="color:#1f4e79;font-size:22px;margin:0 0 14px;font-family:Georgia,serif">${title}</h1>
        ${body}
        ${footer}
      </div>
    </div>
  </body></html>`;
}

function bookingDetailsTable(booking: Booking & { boat: Boat }): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:14px 0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
    ${row("Boat", escape(booking.boat.name))}
    ${row("When", formatBusinessDateTime(booking.scheduledAt))}
    ${row("Ends", formatBusinessDateTime(booking.endsAt))}
    ${row("Duration", durationLabel(booking.duration))}
    ${row("Rental total", formatUSD(booking.rentalPriceCents))}
    ${row("Deposit (" + booking.depositPercent + "%)", formatUSD(booking.depositCents))}
    ${row("Balance due on arrival", formatUSD(booking.rentalPriceCents - booking.depositCents))}
  </table>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 14px;background:#f8fafc;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;width:42%;border-bottom:1px solid #e2e8f0">${label}</td>
    <td style="padding:10px 14px;color:#0a2236;font-weight:600;border-bottom:1px solid #e2e8f0">${value}</td>
  </tr>`;
}

export async function notifyCustomerBookingReceived(booking: Booking & { boat: Boat }) {
  const footer = await getBusinessFooter();
  const html = customerWrap(
    `Hi ${escape(firstName(booking.fullName))} — we have your request`,
    `<p style="margin:0 0 10px">Thanks for choosing Bay Harbor Boat Rentals. We've received your booking request.</p>
     ${bookingDetailsTable(booking)}
     <p style="margin:14px 0 8px"><strong>Two quick steps to lock it in:</strong></p>
     <ol style="margin:0;padding-left:18px;line-height:1.7">
       <li>Sign the rental waiver</li>
       <li>Pay your ${booking.depositPercent}% deposit (${formatUSD(booking.depositCents)})</li>
     </ol>
     <p style="margin:14px 0 0;font-size:13px;color:#475569">If you've already completed both steps, you'll get a confirmation email shortly.</p>`,
    footer
  );
  await sendEmail({
    to: booking.email,
    subject: `Booking received — ${booking.boat.name}`,
    html,
  });
}

export async function notifyCustomerWaiverSigned(booking: Booking & { boat: Boat }, waiver: WaiverSubmission) {
  const footer = await getBusinessFooter();
  const html = customerWrap(
    "Waiver received",
    `<p style="margin:0 0 10px">Thanks ${escape(waiver.fullLegalName)} — we've recorded your signed rental waiver.</p>
     ${bookingDetailsTable(booking)}
     <p style="margin:14px 0 8px">The last step is your <strong>${booking.depositPercent}% deposit</strong> — ${formatUSD(booking.depositCents)} via Stripe. Once that clears, you're all set.</p>`,
    footer
  );
  await sendEmail({
    to: booking.email,
    subject: `Waiver received — ${booking.boat.name}`,
    html,
  });
}

export async function notifyCustomerBookingConfirmed(
  booking: Booking & { boat: Boat },
  payment: StripePayment
) {
  const footer = await getBusinessFooter();
  const s = await getAllSettings();
  const address = s[SETTING_KEYS.address];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const html = customerWrap(
    `You're booked, ${escape(firstName(booking.fullName))}!`,
    `<p style="margin:0 0 10px">Your deposit has been received and your rental is confirmed. We can't wait to see you on the water.</p>
     ${bookingDetailsTable(booking)}
     <p style="margin:14px 0 6px"><strong>Where to meet us</strong></p>
     <p style="margin:0;color:#0a2236"><a href="${mapsUrl}" style="color:#1f4e79">${escape(address)}</a></p>

     <p style="margin:18px 0 6px"><strong>Payment</strong></p>
     <p style="margin:0;color:#475569;font-size:14px">
       Deposit paid: ${formatUSD(payment.amountCents)} (${escape(payment.paymentIntentId || "Stripe")})<br/>
       Balance of <strong>${formatUSD(booking.rentalPriceCents - booking.depositCents)}</strong> due on arrival.
     </p>

     <p style="margin:18px 0 6px"><strong>What to bring</strong></p>
     <ul style="margin:0;padding-left:18px;line-height:1.7;color:#0a2236">
       <li>Valid government-issued photo ID (must be 21+)</li>
       <li>Sunscreen, towel, swimwear</li>
       <li>Cooler with food/drinks if you'd like — we have ice on board</li>
     </ul>

     <p style="margin:18px 0 0;font-size:13px;color:#475569">Need to reschedule or have a question? Call us anytime — see contact info below.</p>`,
    footer
  );
  await sendEmail({
    to: booking.email,
    subject: `Confirmed — ${booking.boat.name} on ${formatBusinessDateTime(booking.scheduledAt)}`,
    html,
  });
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
