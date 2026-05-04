import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SETTING_DEFAULTS: Record<string, string> = {
  business_name: "Bay Harbor Boat Rentals",
  phone: "516-974-8874",
  email: "daniel@bayharborboatrentals.com",
  address: "9901 E Bay Harbor Drive, Bay Harbor Islands, Florida 33154",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  deposit_percent: "30",
  instant_reservations_enabled: "true",
  payment_methods_text:
    "We accept Visa, Mastercard, American Express, Discover, and Apple Pay through Stripe.",
  licensed_insured_text: "Fully licensed and insured for your peace of mind.",
  hero_headline: "Cruise the Bay in Style",
  hero_subheadline:
    "Premium boat rentals from Bay Harbor Islands. Reserve in minutes — no membership required.",
  operating_hours_start: "08:00",
  operating_hours_end: "20:00",
  slot_increment_minutes: "30",
  buffer_minutes_between_bookings: "30",
};

const WAIVER_BODY = `BAY HARBOR BOAT RENTALS — RENTAL & LIABILITY WAIVER

By signing below, I acknowledge that boating involves inherent risks including but not limited to weather, water, equipment, and operator conditions. I agree to operate the vessel in a safe and lawful manner, to follow all U.S. Coast Guard and Florida state regulations, and to wear required safety equipment.

I assume full responsibility for myself and all passengers during the rental period, release Bay Harbor Boat Rentals, its owners, employees, and agents from any and all claims arising from the rental, and agree to pay for any damage caused to the vessel beyond normal wear and tear.

I confirm I am at least 21 years old, that I hold a valid government-issued photo ID, and that I am physically and mentally fit to operate the vessel. I understand that operating a vessel under the influence of alcohol or drugs is illegal and grounds for immediate termination of the rental with no refund.

I have read, understood, and voluntarily agree to the terms of this waiver.`;

const SAMPLE_BOATS = [
  {
    slug: "azure-25",
    name: "Azure 25",
    year: 2022,
    lengthFeet: 25,
    maxCapacity: 8,
    description:
      "Sleek and easy to handle, the Azure 25 is perfect for cruising Biscayne Bay with friends. Bluetooth audio, swim platform, and shaded bimini.",
    status: "available" as const,
    price2hCents: 39900,
    price4hCents: 69900,
    price6hCents: 94900,
    price8hCents: 119900,
    sortOrder: 1,
    photos: [
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    slug: "marlin-29",
    name: "Marlin 29",
    year: 2023,
    lengthFeet: 29,
    maxCapacity: 10,
    description:
      "The Marlin 29 brings extra power and space. Ideal for sandbar days and sunset cruises with family. Coolers, freshwater shower, and premium sound.",
    status: "available" as const,
    price2hCents: 54900,
    price4hCents: 89900,
    price6hCents: 124900,
    price8hCents: 159900,
    sortOrder: 2,
    photos: [
      "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1605283176567-9c4c84d18a99?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    slug: "harbor-yacht-36",
    name: "Harbor Yacht 36",
    year: 2024,
    lengthFeet: 36,
    maxCapacity: 12,
    description:
      "Step aboard our flagship yacht. Twin engines, full cabin, and a finished interior for the ultimate Bay Harbor experience.",
    status: "available" as const,
    price2hCents: 89900,
    price4hCents: 149900,
    price6hCents: 199900,
    price8hCents: 249900,
    sortOrder: 3,
    photos: [
      "https://images.unsplash.com/photo-1502719578322-d4f56a652f2c?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1599582350154-2d1c2cea1d61?auto=format&fit=crop&w=1600&q=80",
    ],
  },
];

const SAMPLE_REVIEWS = [
  {
    authorName: "Jessica P.",
    rating: 5,
    body: "Hands down the best charter we've ever taken. Boat was spotless, captain was friendly, and the views were unreal.",
    sortOrder: 1,
  },
  {
    authorName: "Marcus L.",
    rating: 5,
    body: "Booked the Marlin 29 for a birthday — Daniel made the whole process easy and stress-free. Highly recommend!",
    sortOrder: 2,
  },
  {
    authorName: "Ana R.",
    rating: 5,
    body: "Truly professional operation. Felt safe, well taken care of, and we'll definitely be back next summer.",
    sortOrder: 3,
  },
];

async function main() {
  // Settings
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  // Waiver (universal, version 1, active)
  const existingWaiver = await prisma.waiverVersion.findFirst({ where: { version: 1 } });
  if (!existingWaiver) {
    await prisma.waiverVersion.create({
      data: { version: 1, body: WAIVER_BODY, isActive: true },
    });
  }

  // Boats + photos
  for (const boat of SAMPLE_BOATS) {
    const { photos, ...boatData } = boat;
    const upserted = await prisma.boat.upsert({
      where: { slug: boat.slug },
      update: boatData,
      create: boatData,
    });
    const existingPhotoCount = await prisma.boatPhoto.count({ where: { boatId: upserted.id } });
    if (existingPhotoCount === 0) {
      await prisma.boatPhoto.createMany({
        data: photos.map((url, idx) => ({
          boatId: upserted.id,
          url,
          alt: `${boat.name} photo ${idx + 1}`,
          sortOrder: idx,
        })),
      });
    }
  }

  // Reviews
  for (const r of SAMPLE_REVIEWS) {
    const exists = await prisma.review.findFirst({ where: { authorName: r.authorName, body: r.body } });
    if (!exists) await prisma.review.create({ data: r });
  }

  // Admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@bayharborboatrentals.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me-now";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash, name: "Site Administrator" },
  });

  // eslint-disable-next-line no-console
  console.log("Seeded Bay Harbor Boat Rentals database.");
  // eslint-disable-next-line no-console
  console.log(`Admin login: ${adminEmail}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
