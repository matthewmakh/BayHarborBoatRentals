import { prisma } from "@/lib/prisma";
import { durationLabel } from "@/lib/pricing";
import { getAllSettings, SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

function ics(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { boat: true },
  });
  if (!booking) {
    return new Response("Booking not found", { status: 404 });
  }

  const settings = await getAllSettings();
  const businessName = settings[SETTING_KEYS.businessName];
  const phone = settings[SETTING_KEYS.phone];
  const address = settings[SETTING_KEYS.address];

  const summary = `${businessName} — ${booking.boat.name}`;
  const description =
    `Boat: ${booking.boat.name}\\n` +
    `Duration: ${durationLabel(booking.duration)}\\n` +
    `Meet at: ${address}\\n\\n` +
    `Booking ID: ${booking.id}\\n` +
    `Phone: ${phone}`;

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bay Harbor Boat Rentals//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@bayharborboatrentals.com`,
    `DTSTAMP:${ics(new Date())}`,
    `DTSTART:${ics(booking.scheduledAt)}`,
    `DTEND:${ics(booking.endsAt)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${escapeIcs(address)}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(`Boat rental at ${address} in 1 hour`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="bay-harbor-${booking.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
