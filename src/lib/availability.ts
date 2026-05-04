import type { RentalDuration } from "@prisma/client";
import { prisma } from "./prisma";
import { BUSINESS_TZ, dateInBusinessTz } from "./timezone";
import { getSetting } from "./settings";

export const DURATION_HOURS: Record<RentalDuration, number> = {
  TWO_HOUR: 2,
  FOUR_HOUR: 4,
  SIX_HOUR: 6,
  EIGHT_HOUR: 8,
};

export const SCHEDULING_KEYS = {
  operatingHoursStart: "operating_hours_start",
  operatingHoursEnd: "operating_hours_end",
  slotIncrementMinutes: "slot_increment_minutes",
  bufferMinutes: "buffer_minutes_between_bookings",
} as const;

export const SCHEDULING_DEFAULTS: Record<string, string> = {
  [SCHEDULING_KEYS.operatingHoursStart]: "08:00",
  [SCHEDULING_KEYS.operatingHoursEnd]: "20:00",
  [SCHEDULING_KEYS.slotIncrementMinutes]: "30",
  [SCHEDULING_KEYS.bufferMinutes]: "30",
};

export type SchedulingConfig = {
  openMinutes: number;
  closeMinutes: number;
  incrementMinutes: number;
  bufferMinutes: number;
  operatingHoursStart: string;
  operatingHoursEnd: string;
};

export async function getSchedulingConfig(): Promise<SchedulingConfig> {
  const [open, close, inc, buf] = await Promise.all([
    getSetting(SCHEDULING_KEYS.operatingHoursStart),
    getSetting(SCHEDULING_KEYS.operatingHoursEnd),
    getSetting(SCHEDULING_KEYS.slotIncrementMinutes),
    getSetting(SCHEDULING_KEYS.bufferMinutes),
  ]);
  const operatingHoursStart = open || SCHEDULING_DEFAULTS[SCHEDULING_KEYS.operatingHoursStart];
  const operatingHoursEnd = close || SCHEDULING_DEFAULTS[SCHEDULING_KEYS.operatingHoursEnd];
  return {
    openMinutes: parseClock(operatingHoursStart),
    closeMinutes: parseClock(operatingHoursEnd),
    incrementMinutes: clamp(parseInt(inc || "30", 10), 5, 240),
    bufferMinutes: clamp(parseInt(buf || "30", 10), 0, 240),
    operatingHoursStart,
    operatingHoursEnd,
  };
}

function parseClock(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isNaN(n) ? lo : n));
}

type Range = { start: Date; end: Date };

async function getOccupiedRanges(boatId: string, dayStart: Date, dayEnd: Date): Promise<Range[]> {
  const [bookings, blackouts] = await Promise.all([
    prisma.booking.findMany({
      where: {
        boatId,
        status: { in: ["pending_waiver", "waiver_completed", "pending_payment", "deposit_paid"] },
        scheduledAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { scheduledAt: true, endsAt: true },
    }),
    prisma.boatBlackout.findMany({
      where: {
        boatId,
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);
  return [
    ...bookings.map((b) => ({ start: b.scheduledAt, end: b.endsAt })),
    ...blackouts.map((b) => ({ start: b.startsAt, end: b.endsAt })),
  ];
}

// Returns array of "HH:mm" strings (in business TZ) representing valid start times
// for a `boat × duration × date`. Sub-30min buffer is enforced server-side too.
export async function getAvailableSlots(
  boatId: string,
  dateStr: string,
  duration: RentalDuration
): Promise<string[]> {
  const cfg = await getSchedulingConfig();
  const hours = DURATION_HOURS[duration];
  const blockMinutes = hours * 60;

  // Day window in business TZ as UTC bounds
  const dayStart = dateInBusinessTz(dateStr, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const occupied = await getOccupiedRanges(boatId, dayStart, dayEnd);

  const slots: string[] = [];
  for (let m = cfg.openMinutes; m + blockMinutes <= cfg.closeMinutes; m += cfg.incrementMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const slotStart = dateInBusinessTz(dateStr, `${hh}:${mm}`);
    const slotEnd = new Date(slotStart.getTime() + blockMinutes * 60 * 1000);

    // Don't offer slots in the past (with 5-min grace)
    if (slotStart.getTime() < Date.now() - 5 * 60 * 1000) continue;

    const conflict = occupied.some((o) =>
      rangesOverlap(slotStart, slotEnd, o.start, o.end, cfg.bufferMinutes)
    );
    if (!conflict) slots.push(`${hh}:${mm}`);
  }
  return slots;
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date, bufferMinutes: number): boolean {
  const buf = bufferMinutes * 60 * 1000;
  return aStart.getTime() - buf < bEnd.getTime() && aEnd.getTime() + buf > bStart.getTime();
}

// Server-side check used by bookings POST. Returns null if OK, or an error message.
export async function isSlotAvailable(
  boatId: string,
  scheduledAt: Date,
  duration: RentalDuration
): Promise<{ ok: true; endsAt: Date } | { ok: false; error: string }> {
  const cfg = await getSchedulingConfig();
  const hours = DURATION_HOURS[duration];
  const endsAt = new Date(scheduledAt.getTime() + hours * 60 * 60 * 1000);

  // Validate within operating hours (business TZ)
  const startTime = formatBusinessHHMM(scheduledAt);
  const endTime = formatBusinessHHMM(endsAt);
  const startMin = parseClock(startTime);
  const endMin = parseClock(endTime);
  if (startMin < cfg.openMinutes || endMin > cfg.closeMinutes) {
    return {
      ok: false,
      error: `Selected time is outside operating hours (${cfg.operatingHoursStart}–${cfg.operatingHoursEnd} ET).`,
    };
  }

  const dayStart = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);
  const dayEnd = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  const occupied = await getOccupiedRanges(boatId, dayStart, dayEnd);
  const conflict = occupied.some((o) => rangesOverlap(scheduledAt, endsAt, o.start, o.end, cfg.bufferMinutes));
  if (conflict) {
    return { ok: false, error: "Sorry, that time slot is no longer available. Please pick another." };
  }
  return { ok: true, endsAt };
}

function formatBusinessHHMM(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace("24:", "00:");
}
