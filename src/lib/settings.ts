import { prisma } from "./prisma";

export const SETTING_KEYS = {
  businessName: "business_name",
  phone: "phone",
  email: "email",
  address: "address",
  instagramUrl: "instagram_url",
  facebookUrl: "facebook_url",
  tiktokUrl: "tiktok_url",
  depositPercent: "deposit_percent",
  instantReservationsEnabled: "instant_reservations_enabled",
  paymentMethodsText: "payment_methods_text",
  licensedInsuredText: "licensed_insured_text",
  heroHeadline: "hero_headline",
  heroSubheadline: "hero_subheadline",
  operatingHoursStart: "operating_hours_start",
  operatingHoursEnd: "operating_hours_end",
  slotIncrementMinutes: "slot_increment_minutes",
  bufferMinutes: "buffer_minutes_between_bookings",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const SETTING_DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.businessName]: "Bay Harbor Boat Rentals",
  [SETTING_KEYS.phone]: "516-974-8874",
  [SETTING_KEYS.email]: "daniel@bayharborboatrentals.com",
  [SETTING_KEYS.address]: "9901 E Bay Harbor Drive, Bay Harbor Islands, Florida 33154",
  [SETTING_KEYS.instagramUrl]: "",
  [SETTING_KEYS.facebookUrl]: "",
  [SETTING_KEYS.tiktokUrl]: "",
  [SETTING_KEYS.depositPercent]: "30",
  [SETTING_KEYS.instantReservationsEnabled]: "true",
  [SETTING_KEYS.paymentMethodsText]: "We accept Visa, Mastercard, American Express, Discover, and Apple Pay through Stripe.",
  [SETTING_KEYS.licensedInsuredText]: "Fully licensed and insured for your peace of mind.",
  [SETTING_KEYS.heroHeadline]: "Cruise the Bay in Style",
  [SETTING_KEYS.heroSubheadline]: "Premium boat rentals from Bay Harbor Islands. Reserve in minutes — no membership required.",
  [SETTING_KEYS.operatingHoursStart]: "08:00",
  [SETTING_KEYS.operatingHoursEnd]: "20:00",
  [SETTING_KEYS.slotIncrementMinutes]: "30",
  [SETTING_KEYS.bufferMinutes]: "30",
};

export async function getAllSettings(): Promise<Record<string, string>> {
  // Fall back to defaults if the DB is unreachable (e.g. during build-time prerender).
  try {
    const rows = await prisma.siteSetting.findMany();
    const result: Record<string, string> = { ...SETTING_DEFAULTS };
    for (const r of rows) result[r.key] = r.value;
    return result;
  } catch {
    return { ...SETTING_DEFAULTS };
  }
}

export async function getSetting(key: string): Promise<string> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    return row?.value ?? SETTING_DEFAULTS[key] ?? "";
  } catch {
    return SETTING_DEFAULTS[key] ?? "";
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getDepositPercent(): Promise<number> {
  const raw = await getSetting(SETTING_KEYS.depositPercent);
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || n > 100) return 30;
  return n;
}

export async function getInstantReservationsEnabled(): Promise<boolean> {
  return (await getSetting(SETTING_KEYS.instantReservationsEnabled)) === "true";
}
