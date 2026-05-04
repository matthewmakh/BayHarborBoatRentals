import type { Boat, RentalDuration } from "@prisma/client";
import { getDepositPercent } from "./settings";

export const DURATIONS: { value: RentalDuration; label: string; hours: number }[] = [
  { value: "TWO_HOUR", label: "2 hours", hours: 2 },
  { value: "FOUR_HOUR", label: "4 hours", hours: 4 },
  { value: "SIX_HOUR", label: "6 hours", hours: 6 },
  { value: "EIGHT_HOUR", label: "8 hours", hours: 8 },
];

export function priceForDuration(boat: Boat, duration: RentalDuration): number {
  switch (duration) {
    case "TWO_HOUR":
      return boat.price2hCents;
    case "FOUR_HOUR":
      return boat.price4hCents;
    case "SIX_HOUR":
      return boat.price6hCents;
    case "EIGHT_HOUR":
      return boat.price8hCents;
  }
}

export async function calcDepositCents(boat: Boat, duration: RentalDuration) {
  const rentalCents = priceForDuration(boat, duration);
  const globalPct = await getDepositPercent();
  const pct = boat.depositPercentOverride ?? globalPct;
  const safePct = Math.max(0, Math.min(100, pct));
  const depositCents = Math.round((rentalCents * safePct) / 100);
  return { rentalCents, depositCents, depositPercent: safePct };
}

export function formatUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function durationLabel(d: RentalDuration): string {
  return DURATIONS.find((x) => x.value === d)?.label ?? d;
}
