import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { prisma } from "@/lib/prisma";
import { durationLabel, formatUSD } from "@/lib/pricing";
import { formatBusinessDateTime } from "@/lib/timezone";
import { getAllSettings, SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reservation confirmed" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { booking_id?: string };
}) {
  if (!searchParams.booking_id) {
    return (
      <PublicShell>
        <section className="container-x py-24 max-w-2xl text-center">
          <h1 className="text-4xl font-serif text-navy-800">No booking found</h1>
          <p className="mt-3 text-navy-600">If you just paid, check your email for a confirmation.</p>
          <Link href="/" className="btn-primary mt-6 inline-block">Back to home</Link>
        </section>
      </PublicShell>
    );
  }

  const [booking, settings] = await Promise.all([
    prisma.booking.findUnique({
      where: { id: searchParams.booking_id },
      include: { boat: { include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } } }, payment: true },
    }),
    getAllSettings(),
  ]);
  if (!booking) notFound();

  const phone = settings[SETTING_KEYS.phone];
  const email = settings[SETTING_KEYS.email];
  const address = settings[SETTING_KEYS.address];
  const tel = phone.replace(/\D/g, "");
  const balanceCents = booking.rentalPriceCents - booking.depositCents;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  // Calendar links
  const startUtc = booking.scheduledAt;
  const endUtc = booking.endsAt;
  const ics = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const calTitle = encodeURIComponent(`Bay Harbor Boat Rental — ${booking.boat.name}`);
  const calDetails = encodeURIComponent(
    `Boat: ${booking.boat.name}\nDuration: ${durationLabel(booking.duration)}\nMeet at: ${address}\n\nBooking ID: ${booking.id}\nPhone: ${phone}`
  );
  const calLocation = encodeURIComponent(address);
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${ics(startUtc)}/${ics(endUtc)}&details=${calDetails}&location=${calLocation}`;
  const heroPhoto = booking.boat.photos[0]?.url;
  const isPaid = booking.status === "deposit_paid";

  return (
    <PublicShell>
      {/* Hero confirmation */}
      <section className="relative isolate overflow-hidden bg-navy-900 text-white">
        {heroPhoto && (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${heroPhoto}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/65 to-navy-900/90" aria-hidden="true" />
        <div className="container-x relative py-16 sm:py-20 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-300/40 px-4 py-1.5 text-sm font-medium text-emerald-100 backdrop-blur">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
            {isPaid ? "Deposit confirmed" : "Booking received"}
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-serif drop-shadow">You're booked, {firstName(booking.fullName)}!</h1>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            We can't wait to see you on the water. A confirmation has been sent to <strong>{booking.email}</strong>.
          </p>
        </div>
      </section>

      <section className="container-x py-12 max-w-3xl grid gap-6">
        {/* Booking details */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-600">Your reservation</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Detail label="Boat" value={booking.boat.name} />
            <Detail label="Duration" value={durationLabel(booking.duration)} />
            <Detail label="Start" value={formatBusinessDateTime(booking.scheduledAt)} />
            <Detail label="End" value={formatBusinessDateTime(booking.endsAt)} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 text-center">
            <Money label="Rental total" cents={booking.rentalPriceCents} />
            <Money label={`Deposit paid (${booking.depositPercent}%)`} cents={booking.depositCents} accent />
            <Money label="Balance due on arrival" cents={balanceCents} />
          </div>
          <p className="mt-4 text-xs text-navy-500">Booking ID: {booking.id}</p>
        </div>

        {/* Add to calendar */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-600">Add to your calendar</h2>
          <p className="mt-1 text-sm text-navy-700">So you don't miss a beat.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={googleCalUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">📅 Google Calendar</a>
            <a href={`/api/bookings/${booking.id}/calendar.ics`} className="btn-secondary text-sm">🍎 Apple / Outlook (.ics)</a>
          </div>
        </div>

        {/* Where + when to arrive */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-600">Where to meet us</h2>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-lg font-semibold text-navy-700 hover:text-navy-600">
            {address}
          </a>
          <p className="mt-2 text-sm text-navy-600">
            <strong>Please arrive 15 minutes early</strong> for check-in, ID verification, and a quick safety briefing.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-navy-100">
            <iframe
              title="Map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* What to bring */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-600">What to bring</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-navy-800">
            <Bring icon="🪪">Valid photo ID (must be 21+)</Bring>
            <Bring icon="💳">Card on file for the {formatUSD(balanceCents)} balance</Bring>
            <Bring icon="🧴">Sunscreen, towel, swimwear</Bring>
            <Bring icon="🥤">Cooler with food/drinks (we provide ice)</Bring>
            <Bring icon="🕶️">Sunglasses + hat — Florida sun is no joke</Bring>
            <Bring icon="📱">Phone for photos &amp; music (Bluetooth on board)</Bring>
          </ul>
        </div>

        {/* Contact / questions */}
        <div className="card p-6 bg-gradient-to-br from-navy-50 to-white">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-600">Questions?</h2>
          <p className="mt-2 text-navy-800">
            Need to reschedule, add a guest, or just curious about something? We're a phone call away — usually answer on the first ring.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href={`tel:${tel}`} className="btn-primary justify-center">📞 Call {phone}</a>
            <a href={`mailto:${email}?subject=Booking%20${encodeURIComponent(booking.id)}`} className="btn-secondary justify-center">✉️ Email us</a>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-navy-700 sm:grid-cols-2">
            <Policy title="Reschedule" body="Free up to 48 hours before. Inside 48 hours, we'll do our best to accommodate." />
            <Policy title="Weather" body="If we cancel for unsafe conditions, you get a full refund or free reschedule." />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/" className="btn-secondary">Back to home</Link>
          <Link href="/boats" className="btn-primary">Browse more boats</Link>
        </div>
      </section>
    </PublicShell>
  );
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-navy-50 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-navy-500">{label}</div>
      <div className="font-semibold text-navy-800 mt-0.5">{value}</div>
    </div>
  );
}

function Money({ label, cents, accent }: { label: string; cents: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${accent ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-navy-100 bg-white text-navy-800"}`}>
      <div className={`text-[10px] uppercase tracking-wider ${accent ? "text-emerald-700" : "text-navy-500"}`}>{label}</div>
      <div className="mt-1 text-lg font-semibold">{formatUSD(cents)}</div>
    </div>
  );
}

function Bring({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 rounded-lg border border-navy-100 bg-white px-3 py-2">
      <span aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function Policy({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-navy-100 bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-navy-600">{title}</div>
      <div className="mt-1 text-sm text-navy-800">{body}</div>
    </div>
  );
}
